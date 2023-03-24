let navigator;

export const setNavigator = (nav) => {
  navigator = nav;
};

export const getCurrentRoute = () => {
  const route = navigator.getCurrentRoute();
  return route.name;
};