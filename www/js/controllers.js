angular.module('app.controllers', [])

  .controller('tCCtrl', ['$scope', '$stateParams', '$state', '$rootScope', '$ionicLoading', '$ionicPlatform',
    '$cordovaGeolocation', '$cordovaSms', '$cordovaProgress',
    function ($scope, $stateParams, $state, $rootScope, $ionicLoading, $ionicPlatform, $cordovaGeolocation,
              $cordovaSms, $cordovaProgress) {
      $scope.ready = false;
      $rootScope.emergencyResponder = undefined;
      $ionicPlatform.ready(() => {
        NProgress.start();

        $rootScope.currUser = {};
        var watchOptions = {
          timeout: 15000,
          enableHighAccuracy: false
        };


        var watch = $cordovaGeolocation.watchPosition(watchOptions);
        watch.then(
          null,
          function (err) {
            NProgress.done();
            $scope.ready = true;
            window.location.reload(true);
          },
          function (position) {
            var lat = position.coords.latitude;
            var long = position.coords.longitude;
            $rootScope.currUser.lat = lat;
            $rootScope.currUser.lng = long;
            console.log($rootScope.currUser.lat);
            NProgress.done();
            $scope.ready = true;
            /*$cordovaSms.send('+91-9543554433', `Emergency - @ ${$rootScope.currUser.lat}, ${$rootScope.currUser.lng} (Don't edit this!)`)
             .then(function () {
             alert("Sent");
             console.log("Sent");

             }, function (error) {
             alert(error);
             // An error occurred
             });*/
          }
        );

      });

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

          }
          else {
            $state.go('tC.login')
          }
        }
      )
      ;

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

  .controller('homeCtrl', ['$scope', '$interval', '$rootScope', '$stateParams', '$cordovaSms', '$ionicPlatform', '$cordovaDeviceMotion',
    function ($scope, $interval, $rootScope, $stateParams, $cordovaSms, $ionicPlatform, $cordovaDeviceMotion) {
      // watch Acceleration
      var options = {frequency: 20000};
      $scope.time = Math.ceil(Math.random() * 10) % 3 + 2;
      let c = 1;
      $scope.getTime = () => {
        if (c) {
          $interval(() => {
            $scope.time = $scope.time >= 1 ? $scope.time - 1 : 0;
          }, 60000);
          c = 0;
        }
        return $scope.time;
      };


      $ionicPlatform.ready(() => {
        var watch = $cordovaDeviceMotion.watchAcceleration(options);
        watch.then(
          null,
          function (error) {
            // An error occurred
          },
          function (result) {
            var X = result.x;
            var Y = result.y;
            var Z = result.z;
            var timeStamp = result.timestamp;
            console.log(X, Y, Z);
          });


      }, false);


    }])

  .controller('alertCtrl', ['$scope', '$stateParams', '$rootScope', '$state', '$cordovaSms', '$ionicPlatform', '$cordovaNetwork',
    ($scope, $stateParams, $rootScope, $state, $cordovaSms, $ionicPlatform, $cordovaNetwork) => {
      $scope.crisis = {};

      $scope.post = () => {
        NProgress.start();
        if ($scope.crisis.choice) {
          $scope.crisis.lat = $rootScope.currUser.lat;
          $scope.crisis.lng = $rootScope.currUser.lng;
          $scope.crisis.uid = firebase.auth().currentUser.uid;
          $ionicPlatform.ready(() => {
            var ref = firebase.database().ref(`crises/open/`).push();
            var crisisId = ref.key;
            ref.set($scope.crisis);
            let countRef = firebase.database().ref(`crises/open/count`);
            countRef.transaction(function (current_value) {
              return (current_value || 0) + 1;
            });
            countRef = firebase.database().ref(`crises/count`);
            countRef.transaction(function (current_value) {
              return (current_value || 0) + 1;
            });
            let firebaseRef = firebase.database().ref(`geoLoc/1`);
            let geoFire = new GeoFire(firebaseRef);
            var geoQuery = geoFire.query({
              center: [$scope.crisis.lat, $scope.crisis.lng],
              radius: 20
            });
            let minKey = null;
            let minDist = 25;


            geoQuery.on("key_entered", function (key, location, distance) {
              if (distance < minDist) {
                minDist = distance;
                minKey = key;
              }
              console.log(key + " entered query at " + location + " (" + distance + " km from center)");
            });
            var onReadyRegistration = geoQuery.on("ready", function () {

              let driverRef = firebase.database().ref(`drivers/${minKey}`);
              driverRef.on('value', (data) => {
                $rootScope.emergencyResponder = data.val();
                $rootScope.$apply();
                $scope.crisis = {};
                $state.go('tC.home');
                NProgress.done();
                geoQuery.cancel();
              });
              driverRef = firebase.database().ref(`drivers/${minKey}/`);
              driverRef.update({
                crisisId: crisisId,
                userName: firebase.auth().currentUser.displayName,
                myPic: firebase.auth().currentUser.photoURL
              })
              ;
            });


          })
        }
        else {
          NProgress.done();
          alert("Please choose emergency type!");
        }
      }
    }])

  .controller('profileCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
    ($scope, $stateParams) => {

    }])

  .controller('loginCtrl', ['$scope', '$stateParams', '$state', '$rootScope',
    ($scope, $stateParams, $state, $rootScope) => {

      if ($rootScope.currUser && $rootScope.currUser.uid) {
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
          $rootScope.$apply();
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

    }]);
