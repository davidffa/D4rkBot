declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      EMOJIAPIKEY: string;

      MONGODBURI: string;
      SHAREDDB: string;

      SPOTIFYCLIENTID: string;
      SPOTIFYCLIENTSECRET: string;
      GENIUSLYRICSTOKEN: string;
      HEROKUAPITOKEN: string;

      ERISDOCSAPIURL: string;
      RENDERAPIURL: string;
      RENDERAPITOKEN: string;
      LYRICSAPIURL: string;

      EULAVALINKHOST: string;
      EULAVALINKPORT: string;

      USALAVALINKHOST: string;
      USALAVALINKPORT: string;

      LAVALINKPASSWORD: string;
    }
  }
}

export { }