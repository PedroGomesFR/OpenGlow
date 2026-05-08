import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enJSON from './locales/en.json';
import frJSON from './locales/fr.json';
import esJSON from './locales/es.json';
import deJSON from './locales/de.json';
import itJSON from './locales/it.json';
import ptJSON from './locales/pt.json';
import arJSON from './locales/ar.json';

const savedLng = localStorage.getItem("i18n_language") || "fr";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { ...enJSON },
            fr: { ...frJSON },
            es: { ...esJSON },
            de: { ...deJSON },
            it: { ...itJSON },
            pt: { ...ptJSON },
            ar: { ...arJSON },
        },
        lng: savedLng,
        fallbackLng: "fr",
        interpolation: {
            escapeValue: false,
        },
    }).then(() => {
        // Save only after init is complete, to avoid overwriting with the fallback language
        i18n.on("languageChanged", (lng) => {
            localStorage.setItem("i18n_language", lng);
        });
    });

export default i18n;
