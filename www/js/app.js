angular.module('quicksta', ['ionic','ngCordova','ionicLazyLoad'])
.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: "/home",
	  controller:'homeController',      
      templateUrl: "modules/home/home.html"
    })
	.state('listUsers', {
      url: "/listUsers/:q",
	  controller:'homeController',      
      templateUrl: "modules/search/userlist.html"
    })
	.state('viewUser', {
      url: "/viewUser/:user",
	  controller:'homeController',      
      templateUrl: "modules/search/user.html"
    })
	.state('viewMedia', {
      url: "/viewMedia/:mediaId",
	  controller:'homeController',      
      templateUrl: "modules/media/media.html"
    })
	$urlRouterProvider.otherwise("/home");
})
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.controller('homeController',function($scope,$http,$ionicLoading,$state,$cordovaFileTransfer,$cordovaToast, $ionicModal){
	 $scope.showLoader = function() {
		$ionicLoading.show({
                content: 'Loading',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
              });
	  };
	  $scope.hideLoader = function(){
		$ionicLoading.hide()
	  };
	
	$scope.users={};	
	$scope.q=null;	
	$scope.search=function(q){
		if(q){
			$scope.q=q;		
			$state.go('listUsers',{'q':q});
		}
	};
	
	$scope.users={};
	$scope.serviceLoaded=false;
	function listUserCallback(data){
		$scope.q=data.stateParams.q;
		$http.get('https://quicksta.herokuapp.com/search/user/'+data.stateParams.q).then(function(response){
			$scope.q=data.stateParams.q;
			$scope.users=response.data;
			$scope.hideLoader();
		});		
	}
	function getUserDetailCallback(data){	
		if(data.stateParams.user){	
			$http.get('https://quicksta.herokuapp.com/user/media/'+data.stateParams.user).then(function(response){			
				$scope.userDetails=response.data;
				$scope.hideLoader();
			});	
		}
	}
	function getMediaDetailCallback(data){	
		if(data.stateParams.mediaId){
			$http.get('https://quicksta.herokuapp.com/media/'+data.stateParams.mediaId).then(function(response){			
				$scope.mediaDetails=response.data;
				$scope.hideLoader();
			});
		}
	}
	function getMediaCommentsCallback(data){	
		if(data.stateParams.mediaId){
			$http.get('https://quicksta.herokuapp.com/media/comments/'+data.stateParams.mediaId).then(function(response){			
				$scope.mediaComments=response.data;
				$scope.hideLoader();
			});	
		}		
	}
	$scope.$on("$ionicView.beforeEnter", function(event, data){
		if(data.stateName!=='home'){
			$scope.showLoader();
		}
		switch(data.stateName){
			case 'listUsers':listUserCallback(data);			
			case 'viewUser':getUserDetailCallback(data);			
			case 'viewMedia':getMediaDetailCallback(data);getMediaCommentsCallback(data);			
		}
	});
	$scope.$on("$ionicView.loaded", function(event, data){		
			$scope.hideLoader();	
	});
	$scope.download=function(file){
		 $scope.showLoader();
		var permissions = cordova.plugins.permissions;
		permissions.hasPermission(permissions.READ_EXTERNAL_STORAGE, checkPermissionCallback, null);
        function checkPermissionCallback(status) {
            if (!status.hasPermission) {
                var errorCallback = function () {
                    console.warn('Storage permission is not turned on');
                }
                permissions.requestPermission(
                  permissions.READ_EXTERNAL_STORAGE,
                  function (status) {
                      if (!status.hasPermission) {
						 $scope.hideLoader();
                          errorCallback();						  
                      } else {
                         downloadFile(file);
                          $scope.hideLoader();
                      }
                  },
                  errorCallback);
            }else{				
				downloadFile(file);
			}
        }
	};
	var downloadFile=function(file){
		var url = file;
		var filename = url.split("/").pop();
		var targetPath = cordova.file.externalRootDirectory + "Download/"+filename;
		var trustHosts = true;
		var options = {};
		 
		$cordovaFileTransfer.download(url, targetPath, options, trustHosts)
		  .then(function(result) {
			  refreshMedia.refresh(targetPath);
			  $scope.hideLoader();
			  $cordovaToast.show('File downloaded successfully..', 'short', 'center');	
		  }, function(err) {
			 $cordovaToast.show('Network Issue, Please check internet connectivity', 'short', 'center');
		  }, function (progress) {
			$timeout(function () {
				var dnldpgs = progress.loaded.toString().substring(0, 2);
				$scope.downloadProgress = parseInt(dnldpgs);
			});
		  });
	};
	
	$scope.gotoURL=function(state,params){
		$state.go(state,params);
	};
	
	$scope.showImage=function(imgURL){
		$scope.imgSRC=imgURL.replace('s150x150','');
		$scope.openModal();
	};
	
	$ionicModal.fromTemplateUrl('modules/media/modal.html', {
		scope: $scope,
		animation: 'fade-in'
	  }).then(function(modal) {
		$scope.modal = modal;
	  });
	  
	$scope.openModal = function() {
      $scope.modal.show();
    };

    $scope.closeModal = function() {
	  $scope.imgSRC="";
      $scope.modal.hide();
    };

   
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
	
	$scope.nativeShare=function(file){
		$scope.showLoader();
		window.plugins.socialsharing.share('', '', file,function(){$scope.hideLoader();});
	};
	
	
}).filter('dateText', function(dateFilter) {
  return function(input,isMS) {
	  input=(isMS ? input : input*1000);
     if (!input) {return;}
    var parsed_date = new Date(input);
    var relative_to = new Date(); //defines relative to what ..default is now
    var delta = parseInt((relative_to.getTime()-parsed_date)/1000);
    delta=(delta<2)?2:delta;
    var r = '';
    if (delta < 60) {
    r = delta + ' seconds ago';
    } else if(delta < 120) {
    r = 'a minute ago';
    } else if(delta < (45*60)) {
    r = (parseInt(delta / 60, 10)).toString() + ' minutes ago';
    } else if(delta < (2*60*60)) {
    r = 'an hour ago';
    } else if(delta < (24*60*60)) {
    r = '' + (parseInt(delta / 3600, 10)).toString() + ' hours ago';
    } else if(delta < (48*60*60)) {
    r = 'a day ago';
    } else {
    r = (parseInt(delta / 86400, 10)).toString() + ' days ago';
    }
    return r;
  };
}).filter('abbreviated', function(dateFilter) {
  return function(input) {
		var suffixes = ["", "k", "m", "b","t"];
		var suffixNum = Math.floor((""+input).length/3);
		var shortValue = parseFloat((suffixNum != 0 ? (input / Math.pow(1000,suffixNum)) : input).toPrecision(2));
		if (shortValue % 1 != 0) {
			var shortNum = shortValue.toFixed(1);
		}
		return shortValue+suffixes[suffixNum];
  };
});