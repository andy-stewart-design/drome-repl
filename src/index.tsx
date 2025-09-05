// import "./repl";

/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App.tsx";
import Test from "./Test.tsx";
import "./style.css";

const root = document.getElementById("root")!;

if (window.location.pathname !== "/demo") {
  render(() => <App />, root);
} else {
  render(() => <Test />, root);
}
