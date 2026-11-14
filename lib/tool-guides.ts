export type ToolGuide = {
  steps: string[];
  faqs: Array<{ q: string; a: string }>;
};

const guides: Record<string, ToolGuide> = {
  "qr-code-generator": {
    steps: [
      "Select your QR code type (Website URL, Wi-Fi credentials, Plain Text, Email, or Contact vCard).",
      "Enter your information and customize the colors, pixel size, and error correction level.",
      "Preview the live code and download as a high-resolution PNG or scalable SVG.",
    ],
    faqs: [
      {
        q: "Are the generated QR codes free and permanent?",
        a: "Yes. The generated QR codes are static, meaning your data is encoded directly into the pixel matrix. They never expire and do not depend on any external redirect server.",
      },
      {
        q: "Can I customize the colors and download vector SVGs?",
        a: "Yes, you can pick any foreground and background color, adjust the dimensions up to 600px, and export both PNG raster images and scalable SVG vectors.",
      },
      {
        q: "How does the Wi-Fi QR code work?",
        a: "When scanned by an iPhone, iPad, or Android camera, the device automatically prompts the user to join your wireless network without typing the password.",
      },
    ],
  },
  "barcode-generator": {
    steps: [
      "Choose a standard format such as Code 128, Code 39, EAN-13, EAN-8, UPC-A, or ITF.",
      "Type your product code or alphanumeric value. Check digits for EAN and UPC are automatically computed.",
      "Adjust bar width and height, then download as print-ready PNG or vector SVG.",
    ],
    faqs: [
      {
        q: "Which barcode format should I use for retail?",
        a: "Use UPC-A (12 digits) for retail products distributed in North America and EAN-13 (13 digits) for products sold internationally.",
      },
      {
        q: "Does the generator calculate check digits automatically?",
        a: "Yes. If you enter 12 digits for an EAN-13 barcode or 11 digits for a UPC-A barcode, the standard modulo-10 check digit is automatically calculated and appended.",
      },
      {
        q: "Can these barcodes be scanned by standard laser scanners?",
        a: "Yes. All barcodes follow GS1 and ISO standards, ensuring reliable scanning by handheld optical laser scanners and smartphone cameras.",
      },
    ],
  },
  "currency-converter": {
    steps: [
      "Enter the amount you wish to convert.",
      "Select your source currency and target currency from over 30 global options.",
      "View the live converted total, unit exchange rates, inverse conversion, and rate date.",
    ],
    faqs: [
      {
        q: "Where do the exchange rates come from?",
        a: "Exchange rates are retrieved live from the European Central Bank (ECB) via the Frankfurter open exchange API and updated on business days.",
      },
      {
        q: "Are these rates guaranteed for bank transfers?",
        a: "These rates are indicative mid-market reference rates. Retail banks, credit card networks, and money transfer providers may apply their own spreads or transfer fees.",
      },
      {
        q: "Can I swap the currencies easily?",
        a: "Yes, clicking the swap button (⇆) instantly switches your base and target currencies with real-time inverse rate calculations.",
      },
    ],
  },
  "weather-forecast": {
    steps: [
      "Type any city name into the search box to view instant global autocomplete suggestions.",
      "Select your city to load current conditions, feels-like temperature, wind, and humidity.",
      "Scroll through the 24-hour hourly outlook and 7-day daily forecast.",
    ],
    faqs: [
      {
        q: "How accurate and up-to-date is the weather forecast?",
        a: "Forecasts are powered by Open-Meteo using high-resolution numerical weather prediction models from ECMWF, DWD, and NOAA, updated every hour.",
      },
      {
        q: "Can I view temperatures in Fahrenheit?",
        a: "Yes. Use the °C / °F toggle at the top of the weather card to switch all current, hourly, and daily temperatures instantly.",
      },
      {
        q: "Do I need to allow location access?",
        a: "No, you can search any city worldwide by name. You can also type manual coordinates if preferred.",
      },
    ],
  },
  "world-clock-converter": {
    steps: [
      "Search and add multiple world cities to your comparison dashboard.",
      "Designate a reference city to compare exact hour differences (ahead or behind).",
      "Toggle between 12-hour AM/PM and 24-hour formats with smoothly ticking live clocks.",
    ],
    faqs: [
      {
        q: "Does this tool automatically adjust for Daylight Saving Time (DST)?",
        a: "Yes. The tool uses native IANA time zone rules in your browser, automatically shifting offsets when Daylight Saving Time transitions occur.",
      },
      {
        q: "How do I know if it is daytime or nighttime in another city?",
        a: "Each city card features an illuminated Sun or Moon icon indicating whether the local time is currently within daylight (6:00 AM – 6:00 PM) or nighttime hours.",
      },
      {
        q: "Can I remove or reorder cities?",
        a: "Yes, you can click the 'X' icon on any city card to remove it, or use the quick preset buttons below to restore common hubs.",
      },
    ],
  },
  "public-holiday-finder": {
    steps: [
      "Select a country from over 100 supported nations.",
      "Choose the calendar year (past, current, or upcoming years).",
      "Filter holidays by month or type in the search bar to find specific observances.",
    ],
    faqs: [
      {
        q: "Which countries are included?",
        a: "Over 100 sovereign states are supported via the Nager.Date API, covering official statutory public and national bank holidays.",
      },
      {
        q: "Does the list include regional or state holidays?",
        a: "The API focuses on national public holidays. Regional, municipal, or voluntary company observances may vary by state or province.",
      },
    ],
  },
  "ip-address-lookup": {
    steps: [
      "Click 'Detect My IP' to view your current public address, or paste any IPv4 / IPv6 address.",
      "Click 'Lookup' to query the global IP routing and geolocation registry.",
      "Review the approximate country, city, postal code, ISP, ASN, and network organization.",
    ],
    faqs: [
      {
        q: "Does IP lookup show an exact street address?",
        a: "No. IP geolocation identifies the approximate geographical region and registered internet service provider (ISP), not a physical street address or individual person.",
      },
      {
        q: "Is my IP address saved or logged?",
        a: "No. Lookups are processed on demand without storing your personal queries or browsing data.",
      },
    ],
  },
  "country-information-finder": {
    steps: [
      "Search any country by common name, official name, capital city, or ISO alpha code.",
      "Filter by continental region (Africa, Americas, Asia, Europe, Oceania).",
      "Click any country to inspect official flags, population, land area, currencies, calling codes, and time zones.",
    ],
    faqs: [
      {
        q: "How many countries are in the database?",
        a: "All 250 ISO 3166-1 sovereign nations and recognized dependent territories are cataloged with complete geographic and demographic data.",
      },
      {
        q: "Can I copy the country details?",
        a: "Yes. Click 'Copy Info' to copy the formatted country summary directly to your clipboard for research or documentation.",
      },
    ],
  },
  "sunrise-sunset-calculator": {
    steps: [
      "Enter geographic coordinates or click 'Use Current Location'.",
      "Pick your desired date on the calendar.",
      "Click 'Calculate Solar Times' to view sunrise, sunset, solar noon, dawn, dusk, and total daylight length.",
    ],
    faqs: [
      {
        q: "What is civil twilight vs nautical twilight?",
        a: "Civil twilight occurs when the sun is between 0° and 6° below the horizon, providing enough natural light for outdoor activities. Nautical twilight occurs between 6° and 12° below the horizon.",
      },
      {
        q: "How does it handle polar regions?",
        a: "If coordinates are located within the Arctic or Antarctic circles during Polar Day (Midnight Sun) or Polar Night, the calculator displays a special polar condition banner.",
      },
    ],
  },
  "json-formatter": {
    steps: [
      "Paste your JSON into the input editor, or upload a .json file directly.",
      "Choose your indentation preference (2 spaces, 4 spaces, or tabs) and click Format.",
      "Check the validation status for syntax errors, then copy the beautified JSON or download the file.",
    ],
    faqs: [
      {
        q: "Does this JSON formatter validate syntax and display line errors?",
        a: "Yes. If your JSON is invalid, the validator highlights the exact line and column position of the syntax error.",
      },
      {
        q: "Is my JSON uploaded to any external server?",
        a: "No. All formatting, validation, and minification happen 100% locally in your browser for total privacy.",
      },
      {
        q: "Can I switch between beautifying and minifying?",
        a: "Yes. You can switch between indented beautification and compact single-line minification with a single click.",
      },
    ],
  },
  "json-minifier": {
    steps: [
      "Paste formatted JSON into the input area or upload a .json document.",
      "The tool automatically parses and removes all whitespace and line breaks.",
      "View original vs minified file sizes, compression ratio, and copy or download the minified JSON.",
    ],
    faqs: [
      {
        q: "Does minifying JSON change its data structure or values?",
        a: "No. JSON minification only strips insignificant whitespace, preserving all keys, arrays, and data types identically.",
      },
      {
        q: "What size reduction can I expect?",
        a: "Typically between 20% to 50% depending on the indentation and whitespace of your original JSON.",
      },
    ],
  },
  "javascript-minifier": {
    steps: [
      "Paste your JavaScript source code or upload a .js file.",
      "Choose whether to mangle variable names and perform dead-code elimination.",
      "Inspect the optimized code, view the compression percentage, and download the .min.js bundle.",
    ],
    faqs: [
      {
        q: "Which minifier engine powers this tool?",
        a: "It uses Terser, the industry-standard JavaScript AST parser and minifier used in modern production bundlers.",
      },
      {
        q: "Will it break modern ES6+ features?",
        a: "No. Terser supports modern ECMAScript standards including async/await, optional chaining, and arrow functions.",
      },
    ],
  },
  "css-minifier": {
    steps: [
      "Paste your CSS stylesheet or upload a .css file.",
      "The minifier strips comments, removes unnecessary spaces around braces, and collapses units.",
      "Check for brace matching warnings, view size savings, and download the minified CSS.",
    ],
    faqs: [
      {
        q: "Does CSS minification preserve CSS variables and media queries?",
        a: "Yes. All modern CSS features like custom properties (--var), calc(), and @media rules are safely preserved.",
      },
      {
        q: "Does it remove comments?",
        a: "Yes, all standard block comments (/* ... */) are stripped to reduce payload size.",
      },
    ],
  },
  "html-minifier": {
    steps: [
      "Paste your HTML markup or upload a .html document.",
      "Configure options to remove comments and collapse whitespace between tags.",
      "Review the output and download the optimized .min.html file.",
    ],
    faqs: [
      {
        q: "Will this minifier break <pre> or <code> blocks?",
        a: "No. The minifier detects and protects <pre>, <code>, <script>, <style>, and <textarea> tags to prevent layout distortion.",
      },
      {
        q: "Are HTML comments completely removed?",
        a: "Yes, standard comments are stripped while conditional comments for older browsers can be preserved.",
      },
    ],
  },
  "sql-formatter": {
    steps: [
      "Paste your unformatted SQL query into the editor.",
      "Select your database dialect (PostgreSQL, MySQL, SQLite, T-SQL, etc.) and keyword casing.",
      "Instantly copy the beautifully indented SQL or download it as a .sql file.",
    ],
    faqs: [
      {
        q: "Which SQL dialects are supported?",
        a: "Standard SQL, PostgreSQL, MySQL, SQLite, Transact-SQL (SQL Server), PL/SQL (Oracle), and Google BigQuery.",
      },
      {
        q: "Can I customize SQL keyword casing?",
        a: "Yes, you can format keywords to UPPERCASE, lowercase, or preserve their original casing.",
      },
    ],
  },
  "regex-tester": {
    steps: [
      "Enter your regular expression pattern and select the desired regex flags (g, i, m, s, u).",
      "Type or paste your sample text to evaluate matches in real-time.",
      "Inspect highlighted matches, capture groups, and character index positions in the results table.",
    ],
    faqs: [
      {
        q: "Does this regex tester prevent browser freezing on complex patterns?",
        a: "Yes. Match iterations are capped and executed safely to protect against catastrophic backtracking.",
      },
      {
        q: "Can I use preset patterns for common checks?",
        a: "Yes, one-click presets are available for emails, URLs, IP addresses, dates, phone numbers, and hex colors.",
      },
    ],
  },
  "cron-expression-generator": {
    steps: [
      "Use the visual dropdowns to select minutes, hours, days, months, and weekdays, or type a custom 5-field expression.",
      "Read the plain-English translation to verify your schedule.",
      "Inspect the next 5 upcoming execution timestamps and copy the cron expression.",
    ],
    faqs: [
      {
        q: "What cron format does this generator follow?",
        a: "It generates standard 5-part cron expressions (minute, hour, day-of-month, month, day-of-week) supported by Linux crontab and scheduling frameworks.",
      },
      {
        q: "How are upcoming run times calculated?",
        a: "The tool simulates your cron schedule forward from the current minute to calculate exact future execution dates.",
      },
    ],
  },
  "unix-timestamp-converter": {
    steps: [
      "Enter a Unix epoch timestamp (seconds or milliseconds) or pick a calendar date and time.",
      "The tool automatically detects 10-digit seconds vs 13-digit milliseconds.",
      "View converted UTC, local timezone, relative times, and copy timestamps with one click.",
    ],
    faqs: [
      {
        q: "Does this tool automatically detect seconds versus milliseconds?",
        a: "Yes. Timestamps with 10 digits are treated as seconds; 13 digits are recognized as milliseconds.",
      },
      {
        q: "Does it account for my local timezone?",
        a: "Yes, it presents both the universal UTC/ISO time and your local system timezone with daylight saving adjustments.",
      },
    ],
  },
  "html-preview": {
    steps: [
      "Write or paste HTML, CSS, and JavaScript into the code editor.",
      "View the real-time live preview rendered securely in the sandboxed frame.",
      "Switch between Desktop, Tablet, and Mobile viewport modes to test responsiveness, or download the HTML file.",
    ],
    faqs: [
      {
        q: "Is the preview environment isolated and secure?",
        a: "Yes. The preview renders in an iframe sandboxed with allow-scripts and strictly without allow-same-origin, isolating it from your cookies and storage.",
      },
      {
        q: "Can I test responsive mobile layouts?",
        a: "Yes, easily switch between desktop (100%), tablet (768px), and mobile (375px) viewports with one click.",
      },
    ],
  },
  "yaml-to-json": {
    steps: [
      "Paste your YAML markup or upload a .yaml / .yml file.",
      "Choose your JSON indentation formatting (2 spaces, 4 spaces, or minified).",
      "Validate syntax and copy or download the converted JSON file.",
    ],
    faqs: [
      {
        q: "Does this converter detect syntax errors in YAML?",
        a: "Yes. It pinpoints the exact line and column of indentation or syntax errors in your YAML input.",
      },
      {
        q: "Can it handle complex nested objects and arrays?",
        a: "Yes. Nested maps, sequences, boolean flags, numbers, and multiline strings are accurately transformed into JSON.",
      },
    ],
  },
  "json-to-yaml": {
    steps: [
      "Paste your JSON data into the editor or upload a .json file.",
      "Select your desired indentation spacing (2 or 4 spaces).",
      "Copy the clean YAML output or download it as a .yaml file.",
    ],
    faqs: [
      {
        q: "Are data types preserved when converting JSON to YAML?",
        a: "Yes. Strings, numbers, booleans, arrays, null values, and nested objects are all preserved according to YAML specifications.",
      },
      {
        q: "Is the output compatible with Kubernetes and CI/CD pipelines?",
        a: "Yes, the generated YAML is clean, valid, and fully compatible with Docker Compose, Kubernetes manifests, and GitHub Actions.",
      },
    ],
  },
  "sql-formatter-validator": {
    steps: [
      "Enter your SQL query and choose your database dialect and formatting rules.",
      "Review the automated syntax checks for delimiter balance and clause sequencing.",
      "Copy the formatted SQL or download it as a .sql file.",
    ],
    faqs: [
      {
        q: "What kind of validation does this tool perform?",
        a: "It checks SQL query grammar, matching parentheses and quotes, and verifies proper clause order (e.g. WHERE before GROUP BY).",
      },
      {
        q: "Does it check if my database tables actually exist?",
        a: "No. Client-side validation checks syntax structure only; it does not connect to your live database to inspect schemas or permissions.",
      },
    ],
  },
  "code-diff-checker": {
    steps: [
      "Paste the original code into the left pane and modified code into the right pane, or upload two files.",
      "Toggle between line-by-line or word-by-word diffing, and choose Unified or Split view.",
      "Inspect additions and deletions with color-coded line numbers, and copy the unified diff patch.",
    ],
    faqs: [
      {
        q: "Can I compare code word-by-word as well as line-by-line?",
        a: "Yes. Switch between line-level and word-level diffing to identify exact character-level edits.",
      },
      {
        q: "Can I export the diff as a Git patch?",
        a: "Yes. Click 'Copy Diff Patch' to copy standard unified diff format ready for git apply.",
      },
    ],
  },
  "meta-tags-analyzer": {
    steps: [
      "Enter any webpage URL and click Analyze Meta Tags.",
      "Review the extracted title, description, robots directives, canonical tag, Open Graph, and Twitter metadata.",
      "Check length diagnostics and warning recommendations, then copy or download the JSON report.",
    ],
    faqs: [
      {
        q: "Does optimizing metadata guarantee top search rankings?",
        a: "No. Metadata provides structural cues and context to search crawlers, but rankings depend on content relevance, quality, and comprehensive search algorithms.",
      },
      {
        q: "Why does the tool show character counts for title and description?",
        a: "Search engine snippets typically display 50-60 characters for titles and 140-160 characters for descriptions before truncating them with ellipses.",
      },
    ],
  },
  "open-graph-preview": {
    steps: [
      "Enter a website URL to automatically fetch its Open Graph tags or manually type metadata.",
      "Inspect the simulated social sharing card preview (Facebook and LinkedIn style).",
      "Copy the generated HTML <meta property=\"og:...\" /> tags or download the tag snippet.",
    ],
    faqs: [
      {
        q: "Why might my social preview differ from the actual post on Facebook or LinkedIn?",
        a: "Platforms use their own background caching and aspect ratio rules. Always use platform debugging tools to refresh cached previews.",
      },
      {
        q: "Which Open Graph tags are most important?",
        a: "og:title, og:description, og:image, og:url, and og:type are essential for rich social media cards.",
      },
    ],
  },
  "twitter-card-preview": {
    steps: [
      "Fetch metadata from a live URL or manually enter card title, description, and image URL.",
      "Toggle between Summary and Summary with Large Image card styles.",
      "Copy the generated <meta name=\"twitter:...\" /> HTML tags into your website's <head>.",
    ],
    faqs: [
      {
        q: "What is the difference between summary and summary_large_image?",
        a: "Summary displays a small square thumbnail alongside text, while summary_large_image displays a prominent 16:9 banner image above the snippet.",
      },
      {
        q: "Do I need Twitter card tags if I already have Open Graph tags?",
        a: "X (Twitter) will fall back to Open Graph tags if Twitter tags are missing, but explicit Twitter tags give you precise control over card formatting.",
      },
    ],
  },
  "schema-markup-generator": {
    steps: [
      "Select your desired Schema.org entity type (Organization, Product, Article, FAQ, LocalBusiness, etc.).",
      "Fill in the required details and properties in the intuitive form.",
      "Copy the beautified JSON-LD <script> tag and paste it into your page HTML.",
    ],
    faqs: [
      {
        q: "Where should I place the generated JSON-LD script on my page?",
        a: "Paste the script inside the <head> section or immediately before the closing </body> tag of your HTML document.",
      },
      {
        q: "Does adding schema markup guarantee Google Rich Results?",
        a: "No. Schema markup makes your page eligible for rich results, but search engines decide when and how to display rich snippets based on quality algorithms.",
      },
    ],
  },
  "schema-markup-validator": {
    steps: [
      "Paste your JSON-LD code or <script type=\"application/ld+json\"> snippet into the editor.",
      "The validator verifies JSON syntax and checks Schema.org @context and @type requirements.",
      "Review any detected warnings or missing recommended properties and copy the clean JSON.",
    ],
    faqs: [
      {
        q: "Does this validator check Google Rich Results eligibility?",
        a: "This tool validates JSON syntax and Schema.org vocabulary compliance. Live rich-result eligibility is determined exclusively by Google's crawler testing tools.",
      },
      {
        q: "Can I validate embedded <script> tags directly?",
        a: "Yes. You can paste raw JSON or full <script type=\"application/ld+json\">...</script> HTML snippets.",
      },
    ],
  },
  "canonical-url-checker": {
    steps: [
      "Enter the URL of the webpage you wish to inspect and click Inspect Canonical.",
      "Review the extracted canonical tag, detect multiple or relative canonical issues, and verify self-referencing status.",
      "Copy the verified canonical URL or download the diagnostic report.",
    ],
    faqs: [
      {
        q: "Is it an error if the canonical URL differs from the requested URL?",
        a: "Not necessarily. Pointing to another URL is a deliberate SEO technique to designate a master page when managing duplicate or syndicated content.",
      },
      {
        q: "Why are multiple canonical tags dangerous?",
        a: "When search engines encounter multiple conflicting canonical tags on the same page, they typically ignore all of them and choose a canonical version arbitrarily.",
      },
    ],
  },
  "hreflang-generator": {
    steps: [
      "Add each regional or language version of your page with its language and optional country code.",
      "Designate an x-default fallback version for unmatched languages.",
      "Copy the full reciprocal cluster of <link rel=\"alternate\" hreflang=\"...\" /> tags into the <head> of every page in the group.",
    ],
    faqs: [
      {
        q: "What is the reciprocal tag requirement for hreflang?",
        a: "Every localized page must link to all other localized pages in the group, including a self-referential tag back to itself.",
      },
      {
        q: "What is the x-default hreflang tag used for?",
        a: "x-default tells search engines which page to show visitors whose language or region does not match any specific localized version.",
      },
    ],
  },
  "http-status-checker": {
    steps: [
      "Enter the website or resource URL and click Check Status.",
      "Inspect the HTTP status code (200, 301, 404, 500, etc.), status description, and latency.",
      "Examine safe response headers like Content-Type, Server, and Cache-Control.",
    ],
    faqs: [
      {
        q: "What do the different HTTP status code ranges mean?",
        a: "2xx indicates success, 3xx represents redirects, 4xx denotes client/request errors (e.g. 404 Not Found), and 5xx signals server-side issues.",
      },
      {
        q: "Why might a website return an error in this tool while loading in my browser?",
        a: "Some websites block automated server probes using Cloudflare or anti-bot verification challenges that are not triggered by interactive browsers.",
      },
    ],
  },
  "redirect-checker": {
    steps: [
      "Enter any URL to trace its redirection path.",
      "View each redirect hop, intermediate HTTP status codes (301, 302, 307, 308), and final destination.",
      "Identify redirect loops, unnecessary hops, and copy the full path report.",
    ],
    faqs: [
      {
        q: "What is the difference between a 301 and a 302 redirect for SEO?",
        a: "A 301 redirect is permanent and passes link equity (PageRank) to the destination. A 302 redirect is temporary and may not transfer ranking signals.",
      },
      {
        q: "How many redirect hops are acceptable?",
        a: "Keep redirect chains to a maximum of 1 hop whenever possible. Chains longer than 3 hops increase page load time and risk crawl drop-off.",
      },
    ],
  },
  "url-slug-generator": {
    steps: [
      "Type or paste your blog title, product name, or headline.",
      "Select your separator (hyphen, underscore, dot) and configure stop-word removal.",
      "Copy the clean, SEO-optimized URL slug or preview the full destination link.",
    ],
    faqs: [
      {
        q: "Why are hyphens preferred over underscores in URL slugs?",
        a: "Google treats hyphens as word separators (e.g. 'seo-tools' is read as two words), whereas underscores connect words together.",
      },
      {
        q: "Does removing stop words benefit SEO?",
        a: "Short, punchy slugs that emphasize primary keywords are easier to read, share, and remember for users and search crawlers.",
      },
    ],
  },
  "keyword-research-organizer": {
    steps: [
      "Add keywords individually, paste in batches, or import from CSV.",
      "Assign search intent (Informational, Commercial, Transactional, Navigational), volume, and cluster categories.",
      "Deduplicate repeated keywords, filter by category, and export the organized cluster to CSV.",
    ],
    faqs: [
      {
        q: "Does ToolModeOn fabricate search volume metrics?",
        a: "No. In accordance with our platform transparency policy, search volume and difficulty values are entered or imported by you; we never generate synthetic metrics.",
      },
      {
        q: "Why is classifying search intent important?",
        a: "Targeting keywords with the right intent ensures your page structure matches what searchers expect, improving conversion rates and engagement.",
      },
    ],
  },
  "serp-snippet-preview": {
    steps: [
      "Enter your proposed SEO title, meta description, and page URL.",
      "Toggle between Desktop Google and Mobile Google preview simulations.",
      "Monitor character counts and width indicators to ensure your message avoids truncation.",
    ],
    faqs: [
      {
        q: "What are the recommended title and description limits?",
        a: "Keep titles between 50-60 characters (~600px) and descriptions between 140-160 characters (~960px) to prevent truncation in search results.",
      },
      {
        q: "Why does Google sometimes display a different description than my meta tag?",
        a: "Google dynamically generates snippets based on the user's specific search terms and page content when it believes it provides a more relevant snippet.",
      },
    ],
  },
  "utm-link-builder": {
    steps: [
      "Enter your base website URL.",
      "Fill in campaign parameters: utm_source, utm_medium, and utm_campaign (term and content optional).",
      "Copy the encoded campaign tracking link or download the generated QR code.",
    ],
    faqs: [
      {
        q: "Will this builder preserve existing URL parameters?",
        a: "Yes. Existing query parameters on your base URL are preserved without duplication or formatting errors.",
      },
      {
        q: "What are the three required UTM parameters?",
        a: "utm_source (the referrer e.g. google), utm_medium (the marketing medium e.g. cpc), and utm_campaign (the campaign name) are recommended for accurate analytics.",
      },
    ],
  },
  "broken-link-checker": {
    steps: [
      "Enter a webpage URL to crawl its links or paste a list of URLs.",
      "The tool inspects each link with concurrency limits and SSRF protection.",
      "Filter by working vs broken links, identify 404s and timeouts, and export results to CSV.",
    ],
    faqs: [
      {
        q: "How do broken links affect SEO?",
        a: "Broken links create a poor user experience, waste search engine crawl budget, and disrupt internal link equity distribution.",
      },
      {
        q: "Why are some valid links reported as inaccessible?",
        a: "Certain websites implement aggressive anti-bot firewall rules or CAPTCHAs that block automated HTTP probes from servers.",
      },
    ],
  },
  "website-word-counter": {
    steps: [
      "Enter any accessible webpage URL and click Analyze Webpage.",
      "The tool extracts readable body text while stripping scripts, styles, navigation, and technical markup.",
      "Review total words, characters, sentences, paragraphs, reading time, and export the cleaned text.",
    ],
    faqs: [
      {
        q: "What text elements are excluded from the word count?",
        a: "JavaScript scripts, inline CSS styles, navigational menus, footers, SVGs, and HTML comments are excluded to reflect primary readable content.",
      },
      {
        q: "Can I edit the extracted text to recalculate word count?",
        a: "Yes. The extracted text area is fully editable and dynamically recalculates word, character, and sentence counts in real-time.",
      },
    ],
  },
  "youtube-thumbnail-downloader": {
    steps: [
      "Paste any valid YouTube URL (video, Shorts, mobile link, or youtu.be) into the search bar.",
      "Click Get Thumbnails to validate the video ID and retrieve publicly accessible thumbnail resolutions.",
      "Preview available resolutions (Maximum HD 1080p/720p, SD, High Quality, Medium, and Default).",
      "Download any available resolution as a JPG or copy the direct image URL.",
    ],
    faqs: [
      {
        q: "Why is Maximum HD (1080p/720p) unavailable for some YouTube videos?",
        a: "Maximum resolution thumbnails (maxresdefault.jpg) are only generated by YouTube when the creator uploads a high-resolution custom thumbnail or publishes in HD. Standard and HQ thumbnails are always available.",
      },
      {
        q: "Does this tool work with YouTube Shorts and mobile links?",
        a: "Yes. The tool automatically parses standard desktop links, mobile links (m.youtube.com), youtu.be short links, Shorts (youtube.com/shorts/...), and embedded video URLs.",
      },
      {
        q: "Is any YouTube API key or subscription required?",
        a: "No. All thumbnail resolutions are retrieved directly from YouTube's public content delivery network without paid API keys.",
      },
    ],
  },
  "youtube-banner-resizer": {
    steps: [
      "Upload your banner image (JPG, PNG, or WebP) or drag and drop it into the workspace.",
      "Use the interactive pan and zoom sliders to align key elements within the safe area guide.",
      "Ensure text, logos, and focal subjects stay inside the 1546 × 423 px safe area box.",
      "Choose a canvas background style (Black, Dark Gray, White, or Blurred Image) and export as a 2560 × 1440 px JPG or PNG.",
    ],
    faqs: [
      {
        q: "What are the official recommended YouTube channel banner dimensions?",
        a: "YouTube recommends 2560 × 1440 pixels (16:9 aspect ratio) with a maximum file size under 6MB for optimal display across TV, desktop, tablet, and mobile devices.",
      },
      {
        q: "What is the YouTube banner 'safe area' and why does it matter?",
        a: "The safe area is the central 1546 × 423 pixel zone. Any text, branding, or logos positioned inside this area are guaranteed to be visible on all screen sizes, including mobile smartphones where the outer edges of the banner are cropped.",
      },
      {
        q: "Is my uploaded image processed privately?",
        a: "Yes. Image rendering, scaling, and exporting happen entirely client-side inside your browser canvas. No image files are uploaded to external servers.",
      },
    ],
  },
  "instagram-bio-formatter": {
    steps: [
      "Type or paste your bio into the editor or pick one of our pre-made creator, business, or personal templates.",
      "Apply Unicode font styling (Bold, Script, Monospace, Small Caps) to emphasize key words.",
      "Insert invisible line breaks to prevent Instagram from squishing your paragraphs and line spacing.",
      "Inspect the live Instagram profile preview, check your 150-character limit, and copy your formatted bio.",
    ],
    faqs: [
      {
        q: "How do invisible line breaks prevent Instagram from collapsing empty lines?",
        a: "Instagram automatically strips consecutive standard newline characters. Our tool inserts invisible Unicode zero-width spacing characters so Instagram preserves clean vertical whitespace between your lines.",
      },
      {
        q: "Will custom Unicode fonts display on all mobile devices?",
        a: "Modern iOS and Android devices render Unicode mathematical alphanumeric characters natively. However, screen readers and older Android systems may not announce decorative characters identically, so we recommend using styled fonts for accents and names rather than whole paragraphs.",
      },
      {
        q: "What is the official Instagram bio character limit?",
        a: "Instagram allows up to 150 characters in your profile bio. Our tool features a live character counter that alerts you if you exceed the limit.",
      },
    ],
  },
  "hashtag-generator": {
    steps: [
      "Enter one or more core keywords representing your topic, niche, or product.",
      "Select your industry or niche from the dropdown (Marketing, Tech, Business, Fitness, Travel, etc.).",
      "Browse categorized hashtag recommendations organized across General, Niche, Industry, Business, and Community tiers.",
      "Click chips to select individual hashtags, adjust format to lowercase or CamelCase, and copy your chosen collection.",
    ],
    faqs: [
      {
        q: "How many hashtags should I use on Instagram, LinkedIn, and X?",
        a: "Instagram allows up to 30 hashtags per post, though 3–5 targeted niche tags often yield better engagement. LinkedIn and X (Twitter) perform best with 2–4 relevant hashtags.",
      },
      {
        q: "How does the generator categorize hashtags into tiers?",
        a: "General tags provide broad discoverability, Niche tags capture targeted search intent, Industry tags connect with B2B peers, Business tags target commercial buyers, and Community tags engage creator tribes.",
      },
      {
        q: "Are these hashtags pulled from paid social media APIs?",
        a: "No. Hashtags are generated using curated semantic associations, keyword stemmers, and engagement patterns directly in your browser without tracking or external API dependencies.",
      },
    ],
  },
  "social-media-post-preview": {
    steps: [
      "Select your target platform: X (Twitter), Instagram, Facebook, or LinkedIn.",
      "Enter your post caption, author name, username, and optionally upload an image attachment.",
      "Toggle between mobile and desktop viewport layouts to check responsive text wrapping.",
      "Verify character counts, review truncation points (e.g. '...see more'), and copy your finalized text.",
    ],
    faqs: [
      {
        q: "Does this preview tool connect to or publish on my social media accounts?",
        a: "No. This tool is a 100% browser-based simulation to preview formatting, line breaks, and image aspect ratios before publishing. It does not require login or social account permissions.",
      },
      {
        q: "Where do posts get truncated in social media feeds?",
        a: "Instagram truncates captions after ~125 characters, LinkedIn truncates after ~210 characters, and Facebook truncates after ~250 characters behind a 'See More' link.",
      },
    ],
  },
  "utm-campaign-builder": {
    steps: [
      "Enter your landing page base URL.",
      "Select a quick preset (Google Ads, Facebook Ads, Instagram, Email Marketing, LinkedIn, Affiliate) or enter custom parameters.",
      "Review the encoded campaign URL with utm_source, utm_medium, and utm_campaign.",
      "Copy the tracking link, download the generated QR code, or export your campaign details to CSV.",
    ],
    faqs: [
      {
        q: "What is the difference between UTM Link Builder and UTM Campaign Builder?",
        a: "Both tools provide identical campaign URL generation and parameter validation. The Social Media suite links directly to the enhanced UTM builder with preset campaign templates and CSV export.",
      },
      {
        q: "Will existing query parameters on my URL be preserved?",
        a: "Yes. Existing URL parameters (such as referral IDs or filters) are preserved without overwriting or duplicating characters.",
      },
    ],
  },
  "email-signature-generator": {
    steps: [
      "Enter your contact details: Full Name, Job Title, Company, Phone, Email, and Website.",
      "Upload or link an avatar photo or company logo.",
      "Choose from 6 email-safe templates (Professional, Minimal, Business, Executive, Modern, Compact).",
      "Click 'Copy Formatted Signature' to paste directly into Gmail, Outlook, or Apple Mail, or download the clean HTML code.",
    ],
    faqs: [
      {
        q: "Why does this generator use inline CSS instead of external stylesheets?",
        a: "Major email clients like Microsoft Outlook, Gmail, and Yahoo Mail strip `<style>` tags and external CSS stylesheets. Inline CSS styles on table elements guarantee consistent cross-client rendering.",
      },
      {
        q: "How do I install the signature in Gmail or Outlook?",
        a: "Click 'Copy Formatted Signature (Paste into Gmail / Outlook)'. Then open Gmail Settings > General > Signature (or Outlook Settings > Mail > Compose > Signatures) and paste directly using Ctrl+V or Cmd+V.",
      },
      {
        q: "Is my personal contact information stored on your servers?",
        a: "No. The signature is generated locally in your browser session. No personal names, email addresses, or phone numbers are transmitted or stored.",
      },
    ],
  },
  "qr-business-card-generator": {
    steps: [
      "Fill in your digital business card details: Name, Company, Title, Phone, Email, Address, and Website.",
      "Customize the QR code foreground and background colors to match your brand.",
      "Check the live scannable QR preview and test it with your phone's camera app.",
      "Download your high-resolution QR code as a PNG or scalable vector SVG for printing.",
    ],
    faqs: [
      {
        q: "What is a vCard QR code?",
        a: "A vCard QR code encodes standard contact information (vCard 3.0 format). When scanned by any modern smartphone camera, it prompts the user to save the contact directly into their address book.",
      },
      {
        q: "What QR error correction level is used?",
        a: "We use High (Level H) error correction (up to 30% recovery). This ensures the QR code remains scannable even if printed on textured paper or slightly scuffed on a physical business card.",
      },
      {
        q: "Can I download vector SVG for professional print shops?",
        a: "Yes. You can download crisp vector SVG files that can be scaled to any size for business card printing without pixelation.",
      },
    ],
  },
  "youtube-description-formatter": {
    steps: [
      "Enter your video title, introduction summary, and load a pre-made template (Tutorial, Review, Gaming, etc.).",
      "Format video chapter timestamps starting at 00:00 (e.g. 00:00 Intro, 02:15 Demo).",
      "Add links to products, social media handles, top 3 hashtags, and legal disclaimers.",
      "Inspect the live YouTube plain-text output, verify the 5,000-character limit, and copy or download as a .txt file.",
    ],
    faqs: [
      {
        q: "What are the rules for clickable timestamps on YouTube?",
        a: "Timestamps must start at 00:00, have at least 3 chapters in ascending order, and each chapter must be at least 10 seconds long.",
      },
      {
        q: "How many hashtags show above the YouTube video title?",
        a: "YouTube displays the first 3 hashtags found in your description directly above your video title on watch pages.",
      },
      {
        q: "What is YouTube's video description character limit?",
        a: "YouTube video descriptions have a strict maximum limit of 5,000 characters. Our tool includes a real-time character counter to ensure your description fits.",
      },
    ],
  },
  "social-media-character-counter": {
    steps: [
      "Type or paste your text into the editor.",
      "Review instant real-time statistics: characters with spaces, characters without spaces, word count, lines, and reading time.",
      "Select any platform (Instagram, X, Facebook, LinkedIn, YouTube, Pinterest, TikTok) to compare against official limits.",
      "Monitor progress bars and truncation warnings to ensure your core message is visible before 'See more' breaks.",
    ],
    faqs: [
      {
        q: "What are the character limits for major social platforms?",
        a: "X (Twitter): 280 chars; Instagram Captions: 2,200 chars (truncates at 125); LinkedIn: 3,000 chars (truncates at 210); Facebook: 63,206 chars (truncates at 250); YouTube Descriptions: 5,000 chars.",
      },
      {
        q: "How frequently are platform character limits verified?",
        a: "Our platform limits configuration is centrally maintained and was last verified in November 2026 according to current official platform documentation.",
      },
      {
        q: "What is the difference between character count and word count?",
        a: "Character count measures every letter, number, punctuation mark, and space. Word count measures individual words separated by whitespace. Both metrics are calculated simultaneously in real-time.",
      },
    ],
  },
};

export function getToolGuide(slug: string, name: string, category: string): ToolGuide {
  if (guides[slug]) return guides[slug];

  return {
    steps: [
      `Add your input or select your options for ${name}.`,
      "Review your settings and click the action button to process.",
      "Inspect the live output and download or copy your result.",
    ],
    faqs: [
      {
        q: `Is the ${name} tool free to use?`,
        a: `Yes, ${name} is available on ToolModeOn with generous limits on the free tier.`,
      },
      {
        q: "Are my files or inputs private?",
        a: "Yes. Privacy is fundamental to ToolModeOn. Processing happens locally in your browser whenever supported, and uploaded files are never shared.",
      },
      {
        q: `What category does ${name} belong to?`,
        a: `${name} is part of our ${category} suite designed for fast, frictionless everyday workflows.`,
      },
    ],
  };
}

