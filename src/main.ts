import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { initClerk } from "./lib/clerk";
import GsapPlugin from "./plugins/gsap";

const app = createApp(App);

// 初始化 Clerk
initClerk(app);

app.use(GsapPlugin);

app.mount("#app");
