import type { ExternalPluginConfig } from '@windy/interfaces.d';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-everest-mhews',
    version: '2.9.0',
    icon: '?',
    title: 'Everest Natural Environment Monitoring System',
    description: 'Satellite, environmental observation, and event monitoring for the Everest region.',
    author: 'Everest MHEWS',
    repository: 'https://github.com/Yizebaba/hqmw-cryosphere-windy',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/everest-mhews',
    private: true,
};

export default config;
