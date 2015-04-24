hljs.registerLanguage('ceme', function (hljs) {
    var keywords = ceme.CemeLanguage.Keywords.split(',').join(' ');
    var literals = ceme.CemeLanguage.Literals.split(',').join(' ');
    var builtin = ceme.CemeLanguage.HtmlTags.split(',').join(' ');
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
            {
                className: 'built_in',
                begin: /\+ \- \* \//
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
        ]
    }
});
