import type { ExternalPluginConfig } from '@windy/interfaces.d';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-everest-mhews',
    version: '3.0.4',
    icon: '?',
    title: 'Mount Everest Glacier Movement Analysis',
    description: 'Provisional multi-sensor screening and analysis of glacier movement candidates in the Mount Everest region.',
    author: 'Everest MHEWS',
    repository: 'https://github.com/Yizebaba/hqmw-cryosphere-windy',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/everest-mhews',
    private: true,
};

export default config;
