/**
 * Created by abhilashakanitkar on 31/05/16.
 */
/*global angular */

/**
 * The main controller for the app. The controller:

 * - exposes the model to the template and provides event handlers
 */


angular.module('customapp')
    .controller('CustomAppCtrl', function CustomAppCtrl($scope, $routeParams,$http, $filter,$q,$sce,$timeout) {
        // 'use strict';

        $scope.searchKeyword = '';
        $scope.loggedIn = false;
        $scope.username = '';
        $scope.password = '';
        $scope.productcoffee = new Object();
        $scope.userdetails = new Object();
        $scope.pointsavailabletogive = 1000;
        $scope.tab = 1;
        $scope.userselected = 'No colleague selected!';
        $scope.givepoints = 0;
        $scope.numofcardstoredeem = 0;


        $scope.setTab = function(newTab){
            $scope.tab = newTab;

        };


        $scope.isSet = function(tabNum){
            return $scope.tab === tabNum;

        };

        $scope.usermap = new Object();
        $scope.usermap['Abhilasha Kanitkar'] = 'ABHILASHAK';
        $scope.usermap['Prabhat Mishra'] = 'PRABHAT';
        $scope.usermap['Abhishek Banerjee'] = 'BANERJEE';
        $scope.usermap['Aditi Chaturvedi'] = 'ADITIC';
        $scope.usermap['Ashay Jain'] = 'ASHAYJ';
        $scope.usermap['Megha Khandelwal'] = 'MEGHAK';

        var monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];



        $scope.userSelect = function(username,userid) {
            console.log(username + "--"+userid);
            $scope.userselected = username;
            $scope.userselectedid = userid;
        };
        $scope.init = function(){
            console.log("inside Custom Agents INIT");

            // $http.get('/api/loadinitdata')
            //     .then(function(res){
            //
            //         console.log("sample init data received");
            //         $scope.productcoffee = res.data;
            //
            //         console.log($scope.productcoffee);
            //
            //
            //     });

        };

        $scope.usersignin = function(){

            console.log('Inside usersign fn');
            console.log('Calling userauthenticate api . . . ');
            $scope.userdetails = new Object();

            var userdata = {'username': $scope.username.toUpperCase(), 'password': $scope.password };

            $http.post('/api/userauthenticate/',userdata)
                .then(function(r){
                    console.log('Received response from user authenticate...');
                    console.log(r.data.ret);
                    var rslt = r.data.ret;

                    if(rslt == 'TRUE') {
                        $scope.loggedIn = true;

                        console.log("User details fine, calling api getuserdetails . . . ");
                        $http.get('/api/getuserdetails/'+$scope.username.toUpperCase())
                            .then(function(r) {
                                console.log(r);
                                var tempdata = (r.data.ret);
                                tempdata = tempdata.toString().split(',');

                                $scope.userdetails.usrId = tempdata[0];
                                $scope.userdetails.usrname = tempdata[1];
                                $scope.userdetails.fname = tempdata[2];
                                $scope.userdetails.lname = tempdata[3];
                                $scope.userdetails.usertype = tempdata[4];

                                console.log($scope.userdetails);

                                //Calling other API's

                                if ($scope.userdetails.usrname != 'IVADMIN') {

                                $http.get('/api/getpointsavail/' + $scope.username.toUpperCase())
                                    .then(function (resp) {

                                        console.log("getpointsavail response received");
                                        $scope.userdetails.pointstogive = resp.data.rows[0][0];

                                    });

                                $http.get('/api/getgivehistory/' + $scope.username.toUpperCase())
                                    .then(function (r) {

                                        console.log("getgivehistory received - ");
                                        console.log(r);
                                        $scope.userdetails.giveHistory = r.data.rows;
                                    });

                                $http.get('/api/getPointsForRedeem/' + $scope.username.toUpperCase())
                                    .then(function (r) {
                                        console.log("get points for redeem . . ");
                                        $scope.userdetails.pointstoredeem = r.data.rows[0][0];

                                        if ($scope.userdetails.pointstoredeem >= 10000) {
                                            $scope.numofcardstoredeem = Math.round($scope.userdetails.pointstoredeem / 10000);
                                        }

                                    });

                                $http.get('/api/getReceiveHistory/' + $scope.username.toUpperCase())
                                    .then(function (resp) {
                                        console.log("getReceiveHistory received . . . ");
                                        $scope.userdetails.receiveHistory = resp.data.rows;
                                    });

                               }

                            });




                    }
                    else
                        alert("Invalid Username/Password combination. Please try again!");

                })

        };

        $scope.togglepwd = function() {
            var showpwd = angular.element(document.getElementById('showpwd'));
            //console.log(showpwd.attr('type'));
            if(showpwd.attr('type') == 'password') {
                showpwd.attr('type','text')
            }
            else {
                showpwd.attr('type','password')
            }
        };

        $scope.givePoints = function() {


            console.log("Give points = " + $scope.givepoints);
            console.log(" to : " + $scope.userselectedid);
            console.log("points available " +$scope.userdetails.pointstogive );


            if (parseInt($scope.givepoints) > parseInt($scope.userdetails.pointstogive)) {

                alert("You cannot give more points than available");
            }

            else {

            var givepointsdata = {
                'fromuser': $scope.userdetails.usrname,
                'touser': $scope.userselectedid,
                'givepoints': parseInt($scope.givepoints)
            };

            $http.post('/api/update/givepoints/', givepointsdata)
                .then(function (r) {

                    console.log("Response received from givepoints ");
                    console.log(r);

                    alert("Transaction successful!");
                    //setting the form fields back to original
                    $scope.givepoints = 0;
                    $scope.userselected = 'No colleague selected!';

                    $http.get('/api/getpointsavail/' + $scope.username.toUpperCase())
                        .then(function (resp) {
                            console.log(resp.data);
                            $scope.userdetails.pointstogive = resp.data.rows[0][0];

                        });

                    $http.get('/api/getgivehistory/'+$scope.username.toUpperCase())
                        .then(function(r){

                            console.log("getgivehistory received - ");
                            console.log(r);
                            $scope.userdetails.giveHistory = r.data.rows;
                        });
                });
             }

        };


        $scope.redeemPoints = function() {

            console.log("Redeem Points clicked!");
            console.log("cards to redeem : "+$scope.numofcardstoredeem);
            var id = angular.element(document.getElementById('closepopup'));
            id.click();

            var redeempointsdata = {
                'byuser': $scope.userdetails.usrname,
                'cardstoredeem': parseInt($scope.numofcardstoredeem)
            };

            $http.post('/api/redeemPoints/',redeempointsdata)
                .then(function (r) {
                    console.log("Response received from redeemPoints");
                    console.log(r);

                    if(r.data.ret == 'Success'){

                        alert ("Transaction successful - you will receive the gift card soon! ");
                        $http.get('/api/getPointsForRedeem/'+$scope.username.toUpperCase())
                            .then(function(r){
                                console.log("get points for redeem . . ");
                                $scope.userdetails.pointstoredeem = r.data.rows[0][0];

                                if($scope.userdetails.pointstoredeem >=100000){
                                    $scope.numofcardstoredeem = Math.round($scope.userdetails.pointstoredeem/10000);
                                }

                            });

                    }
                })

        };

        $scope.adminreport = 0;
        $scope.getAdminReport = function(reportnum){
            //var month = 'OCTOBER';

            var d = new Date();
            var mon = d.getMonth();
            console.log("Month : "+ monthNames[mon]);

            if(reportnum == 1) {

                $scope.adminreport = 1;

                $http.get('/api/getReport1/'+mon)
                    .then(function(resp){

                        console.log("Received report 1 repsonse");
                        console.log(resp);
                        $scope.report1Data = resp.data;
                    });
            }
            else if(reportnum == 2) {
                $scope.adminreport = 2;

                $http.get('/api/getReport2/'+mon)
                    .then(function(r){
                        console.log("received report 2 ");
                        console.log(r);
                        $scope.report2Data = r.data;
                    })
            }
            else if(reportnum==3) {
                $scope.adminreport = 3;

                $http.get('/api/getReport3/'+mon)
                    .then(function(r){
                        console.log(" received report 3");
                        console.log(r);
                        $scope.report3Data = r.data;

                    });
               }
        };

        $scope.ResetPoints = function() {
            var d = new Date();
            var mon = d.getMonth();
            var yr = d.getFullYear();
            console.log("Month : "+ monthNames[mon]);
            console.log("Year : "+yr);

          $http.get('/api/AdminResetPoints/'+monthNames[mon]+'/'+yr)
              .then(function(resp){
                  console.log("response from AdminResetPoints received");
                  console.log(resp.data.ret);

                  if(resp.data.ret == 'Oops'){
                      alert("Cannot reset points in the middle of the month!")
                  }
                  else if(resp.data.ret == 'Success') {
                      alert("Successful - Points Reset!")

                  }
                  else {
                      alert("Some error occurred - contact OPS for details")
                  }

              });
        };


});


