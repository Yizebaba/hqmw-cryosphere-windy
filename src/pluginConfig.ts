import type { ExternalPluginConfig } from '@windy/interfaces.d';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-everest-mhews',
    version: '3.1.2',
    icon: '?',
    title: 'Everest Glacier Experimental Analysis',
    description: 'Experimental multi-sensor screening of provisional Mount Everest glacier movement candidates.',
    author: 'Everest MHEWS',
    repository: 'https://github.com/Yizebaba/hqmw-cryosphere-windy',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/everest-mhews',
    private: true,
};

export default config;
