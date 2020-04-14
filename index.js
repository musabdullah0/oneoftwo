addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function getVariants() {
  return fetch('https://cfw-takehome.developers.workers.dev/api/variants')
    .then(response => {
      if (response.ok) {
        return response
      } else {
        throw new Error('failed fetch request')
      }
    })
    .then(response => response.json())
    .catch(error => console.log(error))
}

class ElementHandler {
  constructor(variant) {
    this.variant = variant
  }

  element(element) {
    switch (element.tagName) {
      case 'title':
        const title = !this.variant ? 'One' : 'Two'
        element.setInnerContent(title + ' of Two')
        break

      case 'a':
        element.setAttribute('href', 'https://musabdullah0.github.io/')
        element.setInnerContent('Check out my portfolio page')
        break

      case 'h1':
        const h1 = !this.variant ? 'Team Purple' : 'Team Green'
        element.setInnerContent(h1)
        break

      case 'p':
        const one = 'There are 10 types of people in this word. Those that understand binary and those that don\'t.'
        const two = 'A foo walks into a bar and says \'Hello World\'.'
        element.setInnerContent(!this.variant ? one : two)

      default:
        break
    }
  }
}

function getVariantFromCookies(request) {
  let cookies = request.headers.get('Cookie')
  let name = 'variant='
  let cookieArr = cookies ? cookies.split(';') : ''
  for (let i = 0; i < cookieArr.length; i++) {
    var cookie = cookieArr[i].trim();
    if (cookie.indexOf(name) == 0)
      return parseInt(cookie.substring(name.length, cookie.length));
  }
  return null;
}

/**
 * Respond with one of two pages
 * @param {Request} request
 */
async function handleRequest(request) {
  const responseHeaders = {
    'content-type': 'text/html'
  }
  // make fetch request
  const data = await getVariants();

  // fetch one of two pages, check for cookie/set cookie
  const variant = getVariantFromCookies(request);
  let index
  if (variant != null) {
    index = variant
  } else {
    index = Math.round(Math.random())
    responseHeaders['Set-Cookie'] = 'variant=' + index
  }
  const url = data.variants[index]
  const page = await fetch(url)

  // update page text
  const updated = new HTMLRewriter()
    .on('title', new ElementHandler(index))
    .on('a', new ElementHandler(index))
    .on('h1', new ElementHandler(index))
    .on('p', new ElementHandler(index))
    .transform(page)

  // return updated response
  const html = await updated.text()
  return new Response(html, {
    headers: responseHeaders,
  })
}
