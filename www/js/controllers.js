angular.module('app.controllers', [])

  .controller('tCCtrl', ['$scope', '$stateParams', '$state', '$rootScope', '$ionicLoading', '$ionicPlatform', '$cordovaGeolocation',
    // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
    function ($scope, $stateParams, $state, $rootScope, $ionicLoading, $ionicPlatform, $cordovaGeolocation) {

      firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            console.log(user);
            $state.go('tC.home');
            $rootScope.currUser = user;
            var countRef = firebase.database().ref(`crises/${user.uid}/count`);
            countRef.on('value', function (snapshot) {
              $rootScope.currUser.count = snapshot.val();
              // $scope.$digest();
            });
            $ionicPlatform.ready(() => {


              var watchOptions = {
                timeout: 10000,
                enableHighAccuracy: false // may cause errors if true
              };

              var watch = $cordovaGeolocation.watchPosition(watchOptions);
              watch.then(
                null,
                function (err) {
                  // error
                  console.log(err);
                },
                function (position) {
                  var lat = position.coords.latitude;
                  var long = position.coords.longitude;
                  $rootScope.currUser.lat = lat;
                  $rootScope.currUser.lng = long;
                });


              /*
               var posOptions = {timeout: 10000, enableHighAccuracy: false};
               $cordovaGeolocation
               .getCurrentPosition(posOptions)
               .then((position) => {
               var lat = position.coords.latitude;
               var long = position.coords.longitude;
               console.log(lat);
               console.log(long);
               }, (err) => {
               // error
               });

               });*/
            });
          }
          else {
            $state.go('tC.login')
          }
        }
      );

      $rootScope.showLoad = function () {
        $ionicLoading.show({
          template: 'Loading...',
          duration: 3000
        })
      };
      $rootScope.hideLoad = function () {
        $ionicLoading.hide()
      };
      $scope.logOut = function () {
        $rootScope.showLoad();
        firebase.auth().signOut().then(function () {
          $state.go('tC.login');
          $rootScope.hideLoad();
          console.log("Logged Out");
        }, function (error) {
          // An error happened.
          $rootScope.hideLoad();
          console.log(error);

        });
      }

    }
  ])

  .controller('homeCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
    function ($scope, $stateParams) {

    }])

  .controller('alertCtrl', ['$scope', '$stateParams', '$rootScope', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
    ($scope, $stateParams, $rootScope, $state) => {
      $scope.crisis = {};
      $scope.post = () => {
        console.log($scope.crisis);
        if ($scope.crisis !== {}) {
          $scope.crisis.lat = $rootScope.currUser.lat;
          $scope.crisis.lng = $rootScope.currUser.lng;
          firebase.database().ref(`crises/${$rootScope.currUser.uid}`).push().set($scope.crisis);
          let countRef = firebase.database().ref(`crises/${$rootScope.currUser.uid}/count`);
          countRef.transaction(function (current_value) {
            return (current_value || 0) + 1;
          });
          $scope.crisis = {};
          $state.go('tC.home');
        } else {
          alert("Please choose emergency type!");
        }
      }
    }])

  .controller('profileCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
    ($scope, $stateParams) => {


    }])

  .controller('loginCtrl', ['$scope', '$stateParams', '$state', '$rootScope',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName

    ($scope, $stateParams, $state, $rootScope) => {
      if ($rootScope.currUser) {
        $state.go('tC.home');
      }
      $scope.user = {};
      $scope.login = function () {
        $rootScope.showLoad();
        firebase.auth().signInWithEmailAndPassword($scope.user.email, $scope.user.password).catch(function (error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log(error);
          $scope.err = errorMessage;

        }).then(() => {


          if (!$scope.err) {
            $rootScope.currUser = firebase.auth().currentUser;
            $state.go('tC.home');
            console.log("LoggedIn");
          }
          $rootScope.hideLoad();

        });
      };


      $scope.fbLogin = function () {
        $rootScope.showLoad();
        var provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function (result) {
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          $rootScope.currUser = result.user;

          $state.go('tC.home');
          $rootScope.hideLoad();
          // ...
        }).catch(function (error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          $scope.err = errorMessage;
          // The email of the user's account used.

          console.log(error);
          // ...
        });
      };
      $scope.googleLogin = function () {
        $rootScope.showLoad();
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function (result) {
          // This gives you a Google Access Token. You can use it to access the Google API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          $rootScope.currUser = result.user;
          // ...
          $rootScope.hideLoad();
          console.log($rootScope.currUser);
          $state.go('tC.home');
        }).catch(function (error) {
          $rootScope.hideLoad();
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          $scope.err = errorMessage;
          console.log(error);
          // ...
        });
      }
    }

  ])

  .controller('signupCtrl', ['$scope', '$stateParams', '$state', '$rootScope',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
    function ($scope, $stateParams, $state, $rootScope) {
      $scope.user = {};
      $scope.signup = function () {
        $rootScope.showLoad();
        console.log($scope.user.email);
        firebase.auth().createUserWithEmailAndPassword($scope.user.email, $scope.user.password).catch(function (error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log(error);
          $scope.err = errorMessage;

        }).then(function () {

          console.log("LoggedIn");

          $rootScope.currUser = firebase.auth().currentUser;

          $rootScope.currUser.updateProfile({
            displayName: $scope.user.name,
            phone: $scope.user.phone
          }).then(function () {
            console.log("Done!");
            $rootScope.hideLoad();

            $state.go('tC.home');
          }, function (error) {
            $rootScope.hideLoad();
            console.log(error);
          });
          $rootScope.currUser.sendEmailVerification().then(function () {
            console.log("Sent!");
          }, function (error) {
            console.log(error);
            // An error happened.
          });
        })
      }

    }])
