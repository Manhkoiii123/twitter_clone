# thực hiện login với google

phía client

nếu ko dùng thư viện bên thứ 3 thì làm sao để đá nó sang cái trang callback `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fapi%2Foauth%2Fgoogle&client_id=480331042606-gm573du1155724l8f780em2fel1a5dd3.apps.googleusercontent.com&access_type=offline&response_type=code&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&service=lso&o2v=2&flowName=GeneralOAuthFlow`

=> vào tra `gg oauth` => ấn vào cái `using oauth2.0` (https://developers.google.com/identity/protocols/oauth2) => để ý cái `for js web apps`

bên phía react sẽ setup như sau

```ts
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Link } from "react-router-dom";

const getGoogleAuthUrl = () => {
  const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_REDIRECT_URI } = import.meta.env;
  const url = `https://accounts.google.com/o/oauth2/v2/auth`;
  const query = {
    client_id: VITE_GOOGLE_CLIENT_ID,
    redirect_uri: VITE_GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    prompt: "consent",
    access_type: "offline", // lấy được cả refresh token
  };
  const queryString = new URLSearchParams(query).toString();

  return `${url}?${queryString}`;
};
const gg_oauth_url = getGoogleAuthUrl();
const Home = () => {
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <Link to={gg_oauth_url}>Login with GG</Link>
    </>
  );
};

export default Home;

```

bắt đầu build con be

bên con fe cái env có cái `VITE_GOOGLE_REDIRECT_URI="http://localhost:3000/users/oauth/google"` => phải khai báo routes cho be là `/users/oauth/gg`
