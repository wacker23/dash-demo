import {Html, Head, Main, NextScript} from "next/document";
import Script from 'next/script';
import { headers } from 'next/headers';

function MyDocument() {
  return (
    <Html>
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </Head>
      <body>
      <Main />
      <NextScript />
      <script type={'text/javascript'} src={'//dapi.kakao.com/v2/maps/sdk.js?appkey=f2a8a631a84a3d469959c8ba490c3ee1&libraries=services,clusterer&autoload=false'} defer></script>
      </body>
    </Html>
  );
}

export default MyDocument;
