import * as cheerio from "cheerio";

export interface UrlMetadata {
  title: string;
  description: string;
  thumbnail: string;
  siteName: string;
  favicon: string;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const empty: UrlMetadata = {
    title: "",
    description: "",
    thumbnail: "",
    siteName: "",
    favicon: "",
  };

  try {
    const parsedUrl = new URL(url);

    let response: Response;
    let redirectCount = 0;
    let currentUrl = url;

    // Manual redirect following with a 3-hop limit
    while (redirectCount < 3) {
      response = await fetch(currentUrl, {
        signal: AbortSignal.timeout(5000),
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SaveItBot/1.0; +https://saveit.app)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.get("location")
      ) {
        currentUrl = new URL(
          response.headers.get("location")!,
          currentUrl
        ).toString();
        redirectCount++;
        continue;
      }
      break;
    }

    const html = await response!.text();
    const $ = cheerio.load(html);

    const ogTitle =
      $('meta[property="og:title"]').attr("content") || "";
    const pageTitle = $("title").text().trim();
    const title = ogTitle || pageTitle;

    const ogDescription =
      $('meta[property="og:description"]').attr("content") || "";
    const metaDescription =
      $('meta[name="description"]').attr("content") || "";
    const description = ogDescription || metaDescription;

    const thumbnail =
      $('meta[property="og:image"]').attr("content") || "";

    const ogSiteName =
      $('meta[property="og:site_name"]').attr("content") || "";
    const siteName = ogSiteName || parsedUrl.hostname;

    // Use Google's favicon service
    const favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;

    return {
      title,
      description,
      thumbnail: thumbnail
        ? new URL(thumbnail, url).toString()
        : "",
      siteName,
      favicon,
    };
  } catch {
    // If fetch fails, return partial data
    try {
      const parsedUrl = new URL(url);
      return {
        ...empty,
        siteName: parsedUrl.hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`,
      };
    } catch {
      return empty;
    }
  }
}
