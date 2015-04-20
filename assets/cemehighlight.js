hljs.registerLanguage('ceme', function (hljs) {
    var keywords = cemeEnv.CemeLanguage.Keywords.split(',').join(' ');
    var literals = cemeEnv.CemeLanguage.Literals.split(',').join(' ');
    var builtin = cemeEnv.CemeLanguage.HtmlTags.split(',').join(' ');
    return {
        case_insensitive: false,
        keywords: {
            keyword: keywords,
            literal: literals,
            built_in:
                builtin
        },
        contains: [
            hljs.HASH_COMMENT_MODE,
            {
                className: 'number',
                begin: '\\b(0[xXbBoO][a-fA-F0-9]+|(\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)', // 0x..., 0..., 0b..., 0o..., decimal, float
                relevance: 0
            },
            {
                className: 'string',
                begin: /"""([^"]|\\")*"""|'''([^']|\\')*'''/
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
        ]
    }
});
