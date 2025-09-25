export function htmlHorizontalRule(): Html {
  return "<hr>"
}

export function toHtmlBody(text: string): Html {
  return htmlWrap(text, "body");
}

export function toHtmlH1(text: string): Html {
  return htmlWrap(text, "h1");
}

export function toHtmlH2(text: string): Html {
  return htmlWrap(text, "h2");
}

export function toHtmlH3(text: string): Html {
  return htmlWrap(text, "h3");
}

export function toHtmlParagraph(text: string): Html {
  if (text.startsWith("<table")) {
    return text;
  }
  return htmlWrap(text, "p");
}

function htmlWrap(text:string, wrapper:string):string {
  return `<${wrapper}>${text}</${wrapper}>`
}
