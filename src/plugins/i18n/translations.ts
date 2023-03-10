// refer to https://github.com/bodrovis-learning/Lokalise-source/blob/master/vue-i18n/src/plugins/Translation.js
const languages = {
	tw: { emoji: 'ð¹ð¼', description: 'ç¹é«ä¸­æ' },
	en: { emoji: 'ðºð¸', description: 'English' },
	es: { emoji: 'ðªð¸', description: 'EspaÃ±ol' },
	cn: { emoji: 'ð¨ð³', description: 'ç®ä½ä¸­æ' },
}

export const defaultLocale = import.meta.env.VITE_I18N_LOCALE || 'tw'
export const supportedLocales = ['tw', 'cn', 'en', 'es']

export function isLocaleSupported(locale) {
	return supportedLocales.includes(locale)
}
export function languageDescription(locale: string): string {
	return languages[locale].description || `${locale} not supported`
}
export function languageEmoji(locale: string) {
	return languages[locale].emoji || 'ð¤'
}
