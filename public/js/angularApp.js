angular.module('techNews', ['ui.router'])
.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				resolve: {
					postPromise: ['posts', function(posts) {
						return posts.getAll();
					}]
				}
			})
			.state('posts', {
				url: '/posts/{id}',
				templateUrl: '/posts.html',
				controller: 'PostsCtrl'
			});

		$urlRouterProvider.otherwise('home');
	}])

.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.saveToken = function (token) {
		$window.localStorage['tech-news-token'] = token;
	};

	auth.getToken = function () {
		return $window.localStorage['tech-news-token'];
	};

	auth.isLoggedIn = function () {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function () {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function (user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.login = function (user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logout = function() {
		$window.localStorage.removeItem('tech-news-token');
	};

	return auth;
}])

.factory('posts', ['$http', function($http){
	var o = {
		posts: [{title: 'hello', link:'', upvotes:0}]
	};

	o.getAll = function () {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, o.posts);
		});
	};

	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(res) {
			return res.data;
		});
	};

	o.create = function(post) {
		return $http.post('/posts', post).success(function(data) {
			o.posts.push(data);
		});
	};

	o.upvote = function(post) {
		return $http.post('/posts/' + post._id + '/upvote').success(function(data) {
			post.upvotes += 1;
		});
	};

	return o;
	}])

.controller('MainCtrl', [
	'$scope',
	'posts',
	function ($scope, posts) {
		$scope.posts = posts.posts;

		$scope.addPost = function() {
			if (!$scope.title || $scope.title === '') {
				return;
			}

			posts.create({
				title: $scope.title,
				link: $scope.link
			});

			$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(post) {
			posts.upvote(post);
		};

	}])
.controller('PostsCtrl', [
	'$scope',
	'$stateParams',
	'posts',
	function($scope, $stateParams, posts) {
		$scope.post = posts.posts[$stateParams.id];

		$scope.addComment = function() {
			if ($scope.body === '') { return; }

			$scope.post.comments.push({
				body: $scope.body,
				author: 'user',
				upvotes: 0
			});

		$scope.body = '';
		}

		$scope.incrementUpvotes = function(comment) {
			comment.upvotes += 1;
		}

	}]);