export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url).toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
