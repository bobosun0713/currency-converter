import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "converter",
      component: () => import("../views/ConverterView.vue")
    },
    {
      path: "/rates",
      name: "rates",
      component: () => import("../views/RatesView.vue")
    },
    {
      path: "/favorites",
      name: "favorites",
      component: () => import("../views/FavoritesView.vue")
    }
  ]
});

export default router;
