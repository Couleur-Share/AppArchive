import { createApp } from "vue";
import AppRoot from "./AppRoot.vue";
import router from "./router";
import "./style.css";
import { initAuth } from "./lib/auth";
import GsapPlugin from "./plugins/gsap";

const app = createApp(AppRoot);

app.use(router);
initAuth(app);
app.use(GsapPlugin);

app.mount("#app");
