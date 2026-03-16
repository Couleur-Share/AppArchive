import { createRouter, createWebHistory } from "vue-router";

const AppView = () => import("../App.vue");

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			name: "home",
			component: AppView,
		},
		{
			path: "/software/:id(\\d+)",
			name: "software-detail",
			component: AppView,
		},
		{
			path: "/share/software/:id(\\d+)",
			name: "software-share",
			component: () => import("../views/SoftwareShareView.vue"),
		},
	],
});

export default router;
