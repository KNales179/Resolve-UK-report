(function () {
  var cfg = window.RESOLVE_COMMENTS || {};
  var slots = Array.prototype.slice.call(document.querySelectorAll('[data-thread]'));
  var configured = !!(cfg.url && cfg.anonKey);

  // Adding ?preview=comments to the address shows the boxes before Supabase is connected.
  // Nothing typed in preview is saved anywhere.
  var preview = !configured && /[?&]preview=comments(&|$)/.test(location.search);

  // Otherwise, until the config is filled in, the page stays exactly as it is.
  if ((!configured && !preview) || !slots.length) return;

  var page = document.body.getAttribute('data-page') || 'page';
  var client = null;
  var session = null;
  var comments = [];
  var loadError = false;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function nameFor(comment) {
    if (session && comment.author_id === session.user.id) return 'You';
    var local = String(comment.author_email || 'Someone').split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  function whenFor(comment) {
    return new Date(comment.created_at).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // A stand-in for the database that keeps everything in memory, used only for the preview.
  function previewClient() {
    var rows = [];
    var listeners = [];
    var me = { user: { id: 'preview', email: 'preview@example.com' } };
    return {
      auth: {
        onAuthStateChange: function (callback) {
          listeners.push(callback);
          setTimeout(function () { callback('INITIAL_SESSION', me); }, 0);
        },
        signInWithOtp: function () { return Promise.resolve({ error: null }); },
        signOut: function () {
          listeners.forEach(function (callback) { callback('SIGNED_OUT', null); });
          return Promise.resolve({ error: null });
        }
      },
      from: function () {
        return {
          select: function () {
            return { eq: function () { return { order: function () { return Promise.resolve({ data: rows.slice(), error: null }); } }; } };
          },
          insert: function (row) {
            rows.push({
              id: String(rows.length + 1), author_id: 'preview', author_email: 'preview@example.com',
              created_at: new Date().toISOString(), page: row.page, target: row.target, body: row.body
            });
            return Promise.resolve({ error: null });
          }
        };
      }
    };
  }

  // ---------- sign in ----------
  function signInForm() {
    var form = el('form', 'signin');
    form.appendChild(el('p', 'hint', 'To comment, enter your email and a sign-in link will be sent to you.'));
    var input = el('input');
    input.type = 'email';
    input.required = true;
    input.placeholder = 'you@example.com';
    input.setAttribute('aria-label', 'Email address');
    form.appendChild(input);
    var actions = el('div', 'actions');
    var button = el('button', 'primary', 'Send sign-in link');
    button.type = 'submit';
    var status = el('span', 'status');
    status.setAttribute('role', 'status');
    actions.appendChild(button);
    actions.appendChild(status);
    form.appendChild(actions);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.className = 'status';
      status.textContent = 'Sending...';
      button.disabled = true;
      client.auth.signInWithOtp({
        email: input.value.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname }
      }).then(function (result) {
        button.disabled = false;
        if (result.error) {
          status.className = 'status error';
          status.textContent = /signups? not allowed|not found/i.test(result.error.message)
            ? "That email hasn't been invited."
            : "The link couldn't be sent. Please try again.";
        } else {
          status.textContent = 'Check your email for the sign-in link.';
        }
      });
    });
    return form;
  }

  // ---------- write a comment ----------
  function composer(target, placeholder) {
    var form = el('form', 'composer');
    var area = el('textarea');
    area.required = true;
    area.maxLength = 4000;
    area.placeholder = placeholder;
    area.setAttribute('aria-label', placeholder);
    form.appendChild(area);
    var actions = el('div', 'actions');
    var button = el('button', 'primary', 'Post');
    button.type = 'submit';
    var status = el('span', 'status');
    status.setAttribute('role', 'status');
    actions.appendChild(button);
    actions.appendChild(status);
    form.appendChild(actions);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var body = area.value.trim();
      if (!body) return;
      button.disabled = true;
      status.className = 'status';
      status.textContent = 'Posting...';
      client.from('comments').insert({ page: page, target: target, body: body }).then(function (result) {
        if (result.error) {
          button.disabled = false;
          status.className = 'status error';
          status.textContent = "That couldn't be posted. Please try again.";
        } else {
          refresh();
        }
      });
    });
    return form;
  }

  // ---------- render ----------
  function renderSlot(slot) {
    var target = slot.getAttribute('data-thread');
    var general = target === 'general';
    var mine = comments.filter(function (c) { return c.target === target; });
    slot.textContent = '';

    if (general) {
      var heading = el('h2', null, slot.getAttribute('data-title') || 'Comments');
      heading.id = 'comments';
      slot.appendChild(heading);
      slot.appendChild(el('p', 'hint', 'Replies to the questions above, or anything else, can go here.'));
    }

    if (session && loadError) {
      slot.appendChild(el('p', 'status error', "Comments couldn't be loaded. Please refresh the page."));
    }

    if (session && mine.length) {
      var list = el('ul', 'thread-list');
      mine.forEach(function (c) {
        var item = el('li');
        item.appendChild(el('div', 'comment-meta', nameFor(c) + ' · ' + whenFor(c)));
        item.appendChild(el('p', 'comment-body', c.body));
        list.appendChild(item);
      });
      slot.appendChild(list);
    } else if (session && general && !loadError) {
      slot.appendChild(el('p', 'hint', 'No comments yet.'));
    }

    if (session) {
      slot.appendChild(composer(target, general ? 'Write a comment' : 'Write a reply'));
    } else if (general) {
      slot.appendChild(signInForm());
    } else {
      var toggle = el('button', 'link', 'Reply');
      toggle.type = 'button';
      var holder = el('div', 'holder');
      holder.hidden = true;
      toggle.addEventListener('click', function () {
        holder.hidden = !holder.hidden;
        if (!holder.hidden) {
          holder.textContent = '';
          holder.appendChild(signInForm());
          holder.querySelector('input').focus();
        }
      });
      slot.appendChild(toggle);
      slot.appendChild(holder);
    }
  }

  function renderStatus() {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    var old = bar.querySelector('.auth-status');
    if (old) old.remove();
    if (!session) return;
    var box = el('span', 'auth-status');
    if (preview) {
      box.textContent = 'Preview only. Nothing is saved.';
    } else {
      box.appendChild(document.createTextNode('Signed in as ' + session.user.email + ' · '));
      var out = el('button', 'link', 'Sign out');
      out.type = 'button';
      out.addEventListener('click', function () { client.auth.signOut(); });
      box.appendChild(out);
    }
    bar.insertBefore(box, bar.querySelector('.theme-toggle') || null);
  }

  function renderAll() {
    slots.forEach(renderSlot);
    renderStatus();
  }

  function refresh() {
    if (!session) {
      comments = [];
      loadError = false;
      renderAll();
      return;
    }
    client.from('comments').select('*').eq('page', page).order('created_at', { ascending: true })
      .then(function (result) {
        loadError = !!result.error;
        comments = result.error ? [] : (result.data || []);
        renderAll();
      });
  }

  // ---------- start ----------
  function start() {
    client = preview ? previewClient() : window.supabase.createClient(cfg.url, cfg.anonKey);

    var contents = document.querySelector('.contents');
    if (contents && slots.some(function (s) { return s.getAttribute('data-thread') === 'general'; })) {
      contents.appendChild(document.createTextNode(' · '));
      var link = el('a', null, 'Comments');
      link.href = '#comments';
      contents.appendChild(link);
    }

    // Fires straight away with the current session, then again on sign in and sign out.
    // The data call is deferred so it never runs inside the library's own callback.
    client.auth.onAuthStateChange(function (event, next) {
      session = next;
      setTimeout(refresh, 0);
    });
  }

  if (preview) {
    start();
  } else {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js';
    script.onload = start;
    document.head.appendChild(script);
  }
})();
