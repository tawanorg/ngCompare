(function(window, angular, undefined) {
    'use strict';
    /**
     * Open angularjs modules
     */
    angular.module('CompareCourses', ['ngAnimate'])

    /**
     * Constants setting
     */
    .constant("MY_COMPARE_COUSES", {
        "COMPARE_URL": "http://www.comparecourses.com.au",
        "COMPARE_LIMIT": 4,
    })

    /**
     * initialization of the data source 
     */
    .run(['$rootScope', 'ngCompare','ngCompareItem', 'store', function ($rootScope, ngCompare, ngCompareItem, store) {

        // Save objects when data changed
        $rootScope.$on('ngCompare:change', function(){
            ngCompare.$save();
        });

        // Check exists object, if local storage then display
        if (angular.isObject(store.get('compare'))) {
            // Retrive and restore exists data
            ngCompare.$restore(store.get('compare'));
        } else {
            // Otherwise initial process 
            ngCompare.init();
        }

    }])

    /**
     * ngCompare Service
     *
     * Externally functions work with clienst and connect
     * to internal functions and services
     */
    .service('ngCompare', ['$rootScope', '$window', 'ngCompareItem', 'store','MY_COMPARE_COUSES', function ($rootScope, $window, ngCompareItem, store, MY_COMPARE_COUSES) {

        // Setting prototype main functions
        this.init = function(){
            this.$compare = {
                items : []
            };
        };

        /**
         * To add new item to object
         * @param {string} id   Identifier of course
         * @param {string} name Name of course
         */
        this.addItem = function (id, name) {

            var inCompare = this.getItemById(id);
            // Check exsits object, if exists just update or ignore
            if (typeof inCompare === 'object'){
                $rootScope.$broadcast('ngCompare:itemUpdated', inCompare);
            } 
            // Otherwise add new objects to object array
            else {
                // Check all items in Compare storage
                var countItems = this.getTotalUniqueItems();
                // Set limit in constants if reach more than MY_COMPARE_COUSES.COMPARE_LIMIT
                // Object index start from zero(0) so, - 1 to make equally variables
                if(countItems <= (MY_COMPARE_COUSES.COMPARE_LIMIT - 1)) {
                    var newItem = new ngCompareItem(id, name);
                    this.$compare.items.push(newItem);
                    $rootScope.$broadcast('ngCompare:itemAdded', newItem);
                } else {
                    alert('Sorry, you reached limit');
                }
            }

            $rootScope.$broadcast('ngCompare:change', {});
        };

        /**
         * To get particular id index   
         * @param  {string} itemId Courses Identifier
         * @return {object}        Particular object data
         */
        this.getItemById = function (itemId) {
            var items = this.getCompare().items;
            var build = false;

            angular.forEach(items, function (item) {
                if  (item.getId() === itemId) {
                    build = item;
                }
            });
            return build;
        };
        
        /**
         * Set the data to global object variables
         * @param {object} compare      global local storage variables
         */
        this.setCompare = function (compare) {
            this.$compare = compare;
            return this.getCompare();
        };

        /**
         * Get the data from global object variables
         * @return {object} global local storage variables
         */
        this.getCompare = function(){
            return this.$compare;
        };

        /**
         * Get all items from global local storage
         * @return {obect} index of data
         */
        this.getItems = function(){
            return this.getCompare().items;
        };

        /**
         * Get length of items
         * @return {number}     number of all items
         */
        this.getTotalUniqueItems = function () {
            return this.getCompare().items.length;
        };

        /**
         * To remove/slice single object 
         * @param {string} index    Course index of object
         */
        this.removeItem = function (index) {
            var item = this.$compare.items.splice(index, 1)[0] || {};
            $rootScope.$broadcast('ngCompare:itemRemoved', item);
            $rootScope.$broadcast('ngCompare:change', {});

        };

        /**
         * To remove/slice single object by course id
         * @param {string}  id  Identifier of course 
         */
        this.removeItemById = function (id) {
            var item;
            var compare = this.getCompare();
            angular.forEach(compare.items, function (item, index) {
                if(item.getId() === id) {
                    item = compare.items.splice(index, 1)[0] || {};
                }
            });
            this.setCompare(compare);
            $rootScope.$broadcast('ngCompare:itemRemoved', item);
            $rootScope.$broadcast('ngCompare:change', {});
        };

        /**
         * To clear all data from local storage
         */
        this.empty = function () {
            $rootScope.$broadcast('ngCompare:change', {});
            this.$compare.items = [];
            $window.localStorage.removeItem('compare');
        };
        
        /**
         * To check empty local storage variables
         */
        this.isEmpty = function () {
            return (this.$compare.items.length > 0 ? false : true);
        };

        /**
         * To convert data to object
         */
        this.toObject = function() {
            if (this.getItems().length === 0) return false;
            var items = [];
            angular.forEach(this.getItems(), function(item){
                items.push (item.toObject());
            });
            return {
                items:items
            }
        };

        /**
         * To always retrive and set datas to objects
         */
        this.$restore = function(storedCompare){
            var _self = this;
            _self.init();

            angular.forEach(storedCompare.items, function (item) {
                _self.$compare.items.push(new ngCompareItem(item._id,  item._name));
            });
            this.$save();
        };

        /**
         * To save datas to local storage object
         */
        this.$save = function () {
            return store.set('compare', JSON.stringify(this.getCompare()));
        }

    }])

    /**
     * ngCompareItem Factory
     *
     * Internally functions to manage and organize with datas and objects
     */
    .factory('ngCompareItem', ['$rootScope', '$log', function ($rootScope, $log) {

        var item = function (id, name) {
            this.setId(id);
            this.setName(name);
        };

        item.prototype.setId = function(id){
            if (id)  this._id = id;
            else {
                $log.error('An ID must be provided');
            }
        };

        item.prototype.getId = function(){
            return this._id;
        };

        item.prototype.setName = function(name){
            if (name)  {
                this._name = name;
            } else {
                $log.error('A name must be provided');
            }
        };

        item.prototype.getName = function(){
            return this._name;
        };

        item.prototype.toObject = function() {
            return {
                id: this.getId(),
                name: this.getName()
            }
        };

        return item;

    }])

    /**
     * Store Service   
     * 
     * All functions to set and get local storage data
     */
    .service('store', ['$window', function ($window) {
        return {
            get: function (key) {
                if ( $window.localStorage.getItem(key) )  {
                    var compare = angular.fromJson( $window.localStorage.getItem(key) ) ;
                    return JSON.parse(compare);
                }
                return false;
            },
            set: function (key, val) {

                if (val === undefined) {
                    $window.localStorage.removeItem(key);
                } else {
                    $window.localStorage.setItem( key, angular.toJson(val) );
                }
                return $window.localStorage.getItem(key);
            }
        }
    }])

    /**
     * CompareController   
     * 
     * Controller to interaction with client and angular functions
     */
    .controller('CompareController',['$scope', 'ngCompare', function($scope, ngCompare) {


        $scope.ngCompare = ngCompare;

        $scope.getItemsCompare = function() {
            return ngCompare.getCompare().items;
        }
        
        $scope.getTotalCompareItems = function() {
            return ngCompare.getTotalUniqueItems();
        }

        $scope.addToCompare = function(id, name) {
            return ngCompare.addItem(id, name);
        }

        $scope.removeFromCompare = function(ItemId) {
            return ngCompare.removeItemById(ItemId);
        }

        $scope.showCompareButton = function(ItemId) {
            if(typeof ngCompare.getItemById(ItemId) == "object") {
                return true;
            }
            return false;
        }

    }])

    .value('version', '1.0.0');
 

})(window, window.angular);














