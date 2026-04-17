import { createRouter, createWebHistory } from "vue-router";
import { isSignedIn } from "../lib/auth";

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
		{
			path: "/subscriptions",
			name: "subscriptions",
			component: () => import("../views/SubscriptionsView.vue"),
			meta: { requiresAuth: true },
		},
	],
});

router.beforeEach((to, _from, next) => {
	if (to.meta.requiresAuth && !isSignedIn.value) {
		next({ name: "home" });
		return;
	}
	next();
});

export default router;
