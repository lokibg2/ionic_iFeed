angular.module('app.routes', [])

  .config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider


      .state('tC', {
        url: '/side-menu',
        templateUrl: 'templates/tC.html'
      })


      .state('tC.home', {
        url: '/home',
        views: {
          'side-menu21': {
            templateUrl: 'templates/home.html'
          }
        }
      })


      .state('tC.alert', {
        url: '/alert',
        views: {
          'side-menu21': {
            templateUrl: 'templates/alert.html'
          }
        }
      })


      .state('tC.profile', {
        url: '/profile',
        views: {
          'side-menu21': {
            templateUrl: 'templates/profile.html'
          }
        }
      })


      .state('tC.login', {
        url: '/login',
        views: {
          'side-menu21': {
            templateUrl: 'templates/login.html'
          }
        }
      })

      .state('login', {
        url: '/login',
        views: {
          'side-menu21': {
            templateUrl: 'templates/login.html'
          }
        }
      })


      .state('tC.signup', {
        url: '/signup',
        views: {
          'side-menu21': {
            templateUrl: 'templates/signup.html'
          }
        }
      })


    ;

    // if none of the above states are matched, use this as the fallback

    $urlRouterProvider.otherwise('/side-menu');


  });
