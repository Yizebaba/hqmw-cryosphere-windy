import type { ExternalPluginConfig } from '@windy/interfaces.d';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-everest-mhews',
    version: '1.9.0',
    icon: '⛰',
    title: 'HQMW Cryosphere',
    description: 'NASA GIBS satellite imagery layers for the Windy map.',
    author: 'Everest MHEWS',
    repository: 'https://github.com/Yizebaba/hqmw-cryosphere-windy',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/everest-mhews',
    private: true,
};

export default config;
