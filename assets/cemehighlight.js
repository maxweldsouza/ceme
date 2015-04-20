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
        }
    }
});
