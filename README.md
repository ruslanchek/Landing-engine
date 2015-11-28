# The Landing Engine
Version 0.2

## Installation
Clone this repository

    npm install
    DEV=1 node server // For developement
    node server // For production

## Features
- Less
- Stylus
- Jade
- Autoprefixer
- Minification
- Live reload
- Caching
- i18n


## Browser API
| Param name | Type | Description |
|---|---|---|
| **window.i18n**    | Object    | Current locale dictionary object |


## Jade templates API

| Param name | Type | Description |
|---|---|---|
| **i18n.__**        | Function  | Translating function, takes only one argument – the dictionary keyword |
| **i18n._locale**   | String    | Current locale in ISO 639-1 format |
| **i18n._locales**  | Array     | Array of available locales, each have<br><code>name</code> String (ISO 639-1 code)<br> <code>path</code> String (/YOUR_SITE_NAME/en)<br><code>current</code> Boolean |
| **i18n._jsDictSrc**    | String    | JavaScript source of current locale dictionary |
| **rootDir**        | String    | Root page dir |


## Sites JSON config example
    // ./sites.json
    [
        {
            "dir": "site2",
            "root": "site-2",
            "engines": {
                "html": "jade",
                "css": "less"
                },
            "detectLocale": true,
            "defaultLocale": "ru",
            "locales": [
                "en",
                "ru"
            ]
        },
        ...
    ]

## Server config
    // ./config.json
    {
        "port": 3000
    }

## Page markup example (Jade)
    doctype html
    html(lang=i18n.locale)
        head
            title #{i18n.__('TEST')}
            script(type='text/javascript', src=i18n._jsSrc)
            link(href="/site-1/styles/main.css", rel="stylesheet")
        body
            h1 #{i18n.__('HELLO')}

            h2 #{i18n.__('CURRENT_LOCALE')}
            p #{i18n._locale}

            h2 #{i18n.__('LOCALES')}
            ul
                each locale in i18n._locales
                    li
                        a(href=locale.path) #{locale.name}
                        if locale.current
                            span&nbsp;#{i18n.__('CURRENT_LOCALE')}

## Site file structure example
    ./sites
        /YOUR_SITE_NAME
            /_cache
            /_public
            /assets
            /js
            /locales
                /en.json
                /ru.json
            /styles
                /main.YOUR_PROCESSOR_FILE_EXTENSION
            /templates
                index.jade
