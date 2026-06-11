function corsHeaders(origin) {
  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

async function handleAuth(request, env) {
  const client_id = env.GITHUB_CLIENT_ID;
  const url = new URL(request.url);
  const redirectUrl = new URL('https://github.com/login/oauth/authorize');

  redirectUrl.searchParams.set('client_id', client_id);
  redirectUrl.searchParams.set('redirect_uri', url.origin + '/api/callback');
  redirectUrl.searchParams.set('scope', 'repo user');
  redirectUrl.searchParams.set(
    'state',
    crypto.getRandomValues(new Uint8Array(12)).join(''),
  );

  return Response.redirect(redirectUrl.href, 302);
}

async function handleCallback(request, env) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const client_id = env.GITHUB_CLIENT_ID;
  const client_secret = env.GITHUB_CLIENT_SECRET;

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'decap-cms-oauth-worker',
      accept: 'application/json',
    },
    body: JSON.stringify({ client_id, client_secret, code }),
  });

  const data = await response.json();

  if (data.error) {
    return new Response(JSON.stringify(data), { status: 401 });
  }

  const payload = JSON.stringify({ token: data.access_token, provider: 'github' });

  const content = `<!doctype html><html><body><script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:${payload.replace(/'/g, "\\'")}',
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;

  return new Response(content, { headers: { 'content-type': 'text/html' } });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request.headers.get('origin')) });
    }

    try {
      if (pathname === '/api/auth') return handleAuth(request, env);
      if (pathname === '/api/callback') return handleCallback(request, env);
      return new Response('Not found', { status: 404 });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
