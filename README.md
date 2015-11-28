# The landing engine
Version 0.11

## Browser API
| Param name | Type | Description |
|---|---|---|
| **window.i18n**    | Object    | Current locale dictionary object |


## Jade templates API
### i18n object

| Param name | Type | Description |
|---|---|---|
| **__**        | Function  | Translating function, takes only one argument – the dictionary keyword |
| **_locale**   | String    | Current locale in ISO 639-1 format |
| **_locales**  | Array     | Array of available locales, each have<br><code>name</code> String (ISO 639-1 code)<br> <code>path</code> String (/YOUR_SITE_NAME/en)<br><code>current</code> Boolean |
| **_jsSrc**    | String    | JavaScript source of current locale dictionary |

## Config example
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
    /sites
        /YOUR_SITE_NAME
            /js
            /locales
                /en.json
                /ru.json
            /public
            /styles
                /main.YOUR_PROCESSOR_FILE_EXTENSION
            /templates
                index.jade
