module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: "Inferno214221, Mando369 & Ashuneko",
        description: "An editor for the Markup language Markdown.",
        name: "markright",

        iconUrl: "https://github.com/Inferno214221/Markright/blob/main/markright.ico",
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ["darwin","linux","win32"],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        productName: "Markright",
        name: "markright",
        description: "An editor for the Markup language Markdown.",
        license: "GNU General Public License v3.0",
        categories: ["Utility"],
        icon: "./markright.svg",
        version: "1.0.0",
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        productName: "Markright",
        name: "markright",
        description: "An editor for the Markup language Markdown.",
        license: "GNU General Public License v3.0",
        categories: ["Utility"],
        icon: "./markright.svg",
        version: "1.0.0",
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
