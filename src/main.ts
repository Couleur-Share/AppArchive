import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { initAuth } from "./lib/auth";
import GsapPlugin from "./plugins/gsap";

const app = createApp(App);

initAuth(app);

app.use(GsapPlugin);

app.mount("#app");
