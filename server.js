/**
 * Created by abhilashak on 22/11/17.
 */
// set up ========================
var express = require('express');

var app = express();                               //create our app w/ express
var http = require('http');
var https = require('https');
var oracledb = require('oracledb');
var typaheadWords;
var serverip = '0.0.0.0'; //hiding the organization IP address
var pythonserverport = '8080';
var hostname = '//MSB-MSITM.austin.utexas.edu';
var usr = 'ak39629';
var usrpwd = 'SCOU5sfW';


var monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

var d = new Date();
var mon = d.getMonth();
console.log("Month : "+ monthNames[mon]);


console.log('Hostname is : '+hostname);

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


connstr =
    "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = MSB-MSITM.austin.utexas.edu)(PORT = 1521)) (CONNECT_DATA =(SERVER = DEDICATED)(SID = orcl)))";

console.log(connstr);
console.log('Starting to get oracle connection . . . . .. ');


oracledb.getConnection(
    {
        user          : usr,
        password      : usrpwd,
        connectString : connstr
        //connectString : "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA =(SID= ORCL)))"
    },
    function(err, connection) {
        console.log('Starting to establish a connection. . . . . ');
        if (err) {
            console.error(err.message);
            return;
        }
        console.log('Connection was successful!');

        connection.close(
            function(err) {
                if (err) {
                    console.error(err.message);
                    return;
                }
            });
    });


app.post('/api/userauthenticate', function(req, res) {
    console.log('Inside api userauthenticate . . . . .');
    var username = req.body.username;
    var password = req.body.password;
    var rslt=new Object();

    console.log('Username is :' + username);
    //console.log('Password entered is : '+password);

    oracledb.getConnection(
        {
            user          : usr,
            password      : usrpwd,
            connectString : connstr
        },
        function (err, connection) {
            if (err) { console.error(err.message); return; }

            var bindvars = {
                p1:  username, // Bind type is determined from the data.  Default direction is BIND_IN
                p2:  password,
                ret:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 40 }
            };
            connection.execute(
                "BEGIN :ret := app_user_security.valid_user(:p1, :p2); END;",
                // The equivalent call with PL/SQL named parameter syntax is:
                // "BEGIN :ret := testfunc(p1_in => :p1, p2_in => :p2); END;",
                bindvars,
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    console.log(result.outBinds);
                    rslt = JSON.stringify(result.outBinds);
                    //console.log(JSON.parse(rslt));
                    res.json(JSON.parse(rslt));

                    doRelease(connection);
                });
        });

});

app.get('/api/getuserdetails/:username', function (req, res) {

    console.log(req.params.username);

    var username = encodeURIComponent((req.params.username).trim());

    console.log("inside getuserdetails - " + username);

    oracledb.getConnection(
        {
            user          : usr,
            password      : usrpwd,
            connectString : connstr
        },
        function (err, connection) {
            if (err) { console.error(err.message); return; }

            var bindvars = {
                p1:  username,
                ret:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 }
            };
            connection.execute(
                "BEGIN :ret := app_user_general.get_userdata(:p1); END;",
                // The equivalent call with PL/SQL named parameter syntax is:
                // "BEGIN :ret := testfunc(p1_in => :p1, p2_in => :p2); END;",
                bindvars,
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    console.log(result.outBinds);
                    rslt = JSON.stringify(result.outBinds);
                    //console.log(JSON.parse(rslt));
                    res.json(JSON.parse(rslt));

                    doRelease(connection);
                });
        });




});

app.get('/api/getpointsavail/:username',function(req,res){

    console.log("inside get points avail to give");
    console.log(req.params.username);

    var username = encodeURIComponent((req.params.username).trim());

    var rslt = new Object();
    var qrystr = "select POINTS_TO_GIVE from EMP_GIVE_POINTS_TALLY where emp_username='"+username+"'"

        +" AND trim(MONTH) = trim(to_char(CURRENT_TIMESTAMP , 'MONTH')) AND trim(YEAR) = trim(to_char(CURRENT_TIMESTAMP , 'YYYY'))";
    console.log(qrystr);
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                qrystr ,

                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    rslt = JSON.stringify(result);
                    //console.log(JSON.parse(rslt));


                    res.json(JSON.parse(rslt));

                    connection.release(
                        function(err) {
                            console.log('Releasing connection');
                            if (err) { console.error(err.message); }
                        });
                });
        });



});


app.get('/api/getgivehistory/:username',function(req,res){

    console.log("inside get getgivehistory");
    console.log(req.params.username);

    var username = encodeURIComponent((req.params.username).trim());

    var rslt = new Object();
    var qrystr = "select TO_EMP,POINTS,to_char(TRANSACTION_TIMESTAMP , 'MON-DD-YYYY') from POINTS_TRANSACTION where BY_EMP ='"+username+"'"
        +" AND to_char(TRANSACTION_TIMESTAMP , 'MONTH') = to_char(CURRENT_TIMESTAMP , 'MONTH')";
    console.log(qrystr);
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                qrystr ,

                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    rslt = JSON.stringify(result);
                    //console.log(JSON.parse(rslt));


                    res.json(JSON.parse(rslt));

                    connection.release(
                        function(err) {
                            console.log('Releasing connection');
                            if (err) { console.error(err.message); }
                        });
                });
        });



});

app.get('/api/getPointsForRedeem/:username',function(req,res){

    console.log("inside get points for redeem");
    console.log(req.params.username);

    var username = encodeURIComponent((req.params.username).trim());

    var rslt = new Object();
    var qrystr = "select POINTS_TO_REDEEM from EMP_RECEIVE_POINTS_TALLY where emp_username='"+username+"'";

    console.log(qrystr);
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                qrystr ,

                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    rslt = JSON.stringify(result);
                    //console.log(JSON.parse(rslt));


                    res.json(JSON.parse(rslt));

                    connection.release(
                        function(err) {
                            console.log('Releasing connection');
                            if (err) { console.error(err.message); }
                        });
                });
        });



});

app.get('/api/getReceiveHistory/:username',function(req,res){

    console.log("inside get getReceiveHistory");
    console.log(req.params.username);

    var username = encodeURIComponent((req.params.username).trim());

    var rslt = new Object();
    var qrystr = "select BY_EMP,POINTS,to_char(TRANSACTION_TIMESTAMP , 'MON-DD-YYYY') from POINTS_TRANSACTION where TO_EMP ='"+username+"'"
        +" AND to_char(TRANSACTION_TIMESTAMP , 'MONTH') = to_char(CURRENT_TIMESTAMP , 'MONTH')";
    console.log(qrystr);
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                qrystr ,

                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    rslt = JSON.stringify(result);
                    //console.log(JSON.parse(rslt));


                    res.json(JSON.parse(rslt));

                    connection.release(
                        function(err) {
                            console.log('Releasing connection');
                            if (err) { console.error(err.message); }
                        });
                });
        });



});


app.post('/api/update/givepoints/', function(req, res) {
    console.log('Inside api update givepoints . . . . .');
    var fromuser = req.body.fromuser;
    var touser = req.body.touser;
    var givepoints = req.body.givepoints;
    var rslt=new Object();

    console.log('To user is :' + touser);
    console.log('from user : '+fromuser);
    console.log('points : '+givepoints);

    oracledb.getConnection(
        {
            user          : usr,
            password      : usrpwd,
            connectString : connstr
        },
        function (err, connection) {
            if (err) { console.error(err.message); return; }

            var bindvars = {
                p1: fromuser,
                p2:  touser, // Bind type is determined from the data.  Default direction is BIND_IN
                p3:  parseInt(givepoints),
                ret:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 40 }
            };
            connection.execute(
                "BEGIN app_user_general.add_points_transaction(:p1, :p2, :p3,:ret); END;",
                // The equivalent call with PL/SQL named parameter syntax is:
                // "BEGIN :ret := testfunc(p1_in => :p1, p2_in => :p2); END;",
                bindvars,
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    console.log(result.outBinds);
                    rslt = JSON.stringify(result.outBinds);
                    //console.log(JSON.parse(rslt));
                    res.json(JSON.parse(rslt));

                    doRelease(connection);
                });
        });

});


app.post('/api/redeemPoints/', function(req, res) {
    console.log('Inside api update redeemPoints . . . . .');

    var byuser = req.body.byuser;
    var cardstoredeem = req.body.cardstoredeem;
    var pointstoredeem = cardstoredeem * 10000;

    console.log("By user : "+ byuser);
    console.log("cards to redeem : "+ cardstoredeem);
    console.log("points to redeem : " + pointstoredeem);


    var rslt=new Object();



    oracledb.getConnection(
        {
            user          : usr,
            password      : usrpwd,
            connectString : connstr
        },
        function (err, connection) {
            if (err) { console.error(err.message); return; }

            var bindvars = {
                p1: byuser,
                p2: parseInt(pointstoredeem), // Bind type is determined from the data.  Default direction is BIND_IN
                ret:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 40 }
            };
            connection.execute(
                "BEGIN app_user_general.redeem_points(:p1, :p2,:ret); END;",
                // The equivalent call with PL/SQL named parameter syntax is:
                // "BEGIN :ret := testfunc(p1_in => :p1, p2_in => :p2); END;",
                bindvars,
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    console.log(result.outBinds);
                    rslt = JSON.stringify(result.outBinds);
                    //console.log(JSON.parse(rslt));
                    res.json(JSON.parse(rslt));

                    doRelease(connection);
                });
        });

});

app.get('/api/getReport1/:month',function(req,res){

    console.log("inside get getReport1");
    console.log(req.params.month);

    var month = encodeURIComponent((req.params.month).trim());

    currmon = monthNames[month];
    currmon1 = monthNames[month-1];
    currmon2 = monthNames[month-2];

    console.log(currmon);
    console.log(currmon1);
    console.log(currmon2);

    var monstr = "'"+currmon+"','"+currmon1+"','"+currmon2+"'";

    var rslt = new Object();
    // var qrystr = "SELECT * FROM\n" +
    //     "(\n" +
    //     "SELECT EMPLOYEE_DETAILS.EMPUSERNAME\n" +
    //     "       ,NVL(A.given_points,0) given_points\n" +
    //     "       ,NVL(A.received_points,0) received_points\n" +
    //     "FROM\n" +
    //     "(\n" +
    //     "SELECT NVL(X.BY_EMP ,Y.TO_EMP)EMPUSERNAME , X.given_points,Y.received_points\n" +
    //     "FROM \n" +
    //     "\n" +
    //     "(select BY_EMP,to_char(transaction_timestamp,'fmMONTH') month, SUM (POINTS) given_points\n" +
    //     "from POINTS_TRANSACTION\n" +
    //     "WHERE to_char(transaction_timestamp,'fmMONTH') = '"+month+"'\n" +
    //     "group by BY_EMP,to_char(transaction_timestamp,'fmMONTH')\n" +
    //     ")X FULL OUTER JOIN \n" +
    //     "(\n" +
    //     "select TO_EMP,to_char(transaction_timestamp,'fmMONTH') month, SUM (POINTS) received_points\n" +
    //     "from POINTS_TRANSACTION\n" +
    //     "WHERE to_char(transaction_timestamp,'fmMONTH') = '"+month+"'\n" +
    //     "group by TO_EMP,to_char(transaction_timestamp,'fmMONTH')\n" +
    //     ") Y \n" +
    //     "ON X.BY_EMP = Y.TO_EMP\n" +
    //     ") A RIGHT OUTER JOIN\n" +
    //     "EMPLOYEE_DETAILS ON A.EMPUSERNAME = EMPLOYEE_DETAILS.EMPUSERNAME\n" +
    //     "WHERE EMPLOYEE_DETAILS.EMPUSERNAME != 'IVADMIN'\n" +
    //     ") T\n" +
    //     "ORDER BY T.received_points desc";

    var qrystr = "select * from AGGREGATE_USAGE_REPORT where trim(month) in ("+monstr+")";
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                qrystr ,

                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    rslt = JSON.stringify(result);
                    //console.log(JSON.parse(rslt));


                    res.json(JSON.parse(rslt));

                    connection.release(
                        function(err) {
                            console.log('Releasing connection');
                            if (err) { console.error(err.message); }
                        });
                });
        });



});

app.get('/api/getReport2/:month',function(req,res){

    console.log("inside get getReport2");
    console.log(req.params.month);


    var month = encodeURIComponent((req.params.month).trim());
    currmon = monthNames[month];
    currmon1 = monthNames[month-1];
    currmon2 = monthNames[month-2];

    console.log(currmon);
    console.log(currmon1);
    console.log(currmon2);

    var monstr = "'"+currmon+"','"+currmon1+"','"+currmon2+"'";
    console.log(monstr);

    var rslt = new Object();
    var qrystr = "SELECT * \n" +
        "FROM EMP_GIVE_POINTS_TALLY\n" +
        "WHERE points_to_give > 0\n" +
        "AND trim(MONTH) IN ("+monstr+")\n";

    //console.log(qrystr);
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                qrystr ,

                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    rslt = JSON.stringify(result);
                    //console.log(JSON.parse(rslt));

                    res.json(JSON.parse(rslt));

                    connection.release(
                        function(err) {
                            console.log('Releasing connection');
                            if (err) { console.error(err.message); }
                        });
                });
        });

});

app.get('/api/getReport3/:month',function(req,res){

    console.log("inside get getReport3");
    console.log(req.params.month);


    var month = encodeURIComponent((req.params.month).trim());
    currmon = monthNames[month];
    currmon1 = monthNames[month-1];
    currmon2 = monthNames[month-2];

    console.log(currmon);
    console.log(currmon1);
    console.log(currmon2);

    var monstr = "'"+currmon+"','"+currmon1+"','"+currmon2+"'";
    console.log(monstr);

    var rslt = new Object();
    var qrystr = "select EMP_USERNAME, TO_CHAR(REDEEM_TIMESTAMP, 'DD-MON-YYYY') \"DATE\", POINTS_REDEEMED/10000 GIFT_CARDS_REDEEMED \n" +
        "from EMPLOYEE_POINTS_REDEEM_HISTORY\n" +
        "where trim(MONTH) in ("+monstr+")\n";

    //console.log(qrystr);
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                qrystr ,

                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    rslt = JSON.stringify(result);
                    //console.log(JSON.parse(rslt));

                    res.json(JSON.parse(rslt));

                    connection.release(
                        function(err) {
                            console.log('Releasing connection');
                            if (err) { console.error(err.message); }
                        });
                });
        });

});


app.get('/api/AdminResetPoints/:m/:y',function(req,res){

    console.log("inside get AdminResetPoints");
    console.log(req.params.m);


    var m = encodeURIComponent((req.params.m).trim());
    var y = encodeURIComponent((req.params.y).trim());

    var rslt = new Object();
    var bindvars = {
        p1: m,
        p2: y, // Bind type is determined from the data.  Default direction is BIND_IN
        ret:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 40 }
    };
    oracledb.getConnection(
        {
            user          : "ak39629",
            password      : "SCOU5sfW",
            connectString : connstr
        },
        function(err, connection)
        {
            if (err) { console.error(err.message);
                res.render('index', {result: 'Oracle error!'}); return; }
            connection.execute(
                "BEGIN app_user_general.reset_points(:p1, :p2,:ret); END;",
                // The equivalent call with PL/SQL named parameter syntax is:
                // "BEGIN :ret := testfunc(p1_in => :p1, p2_in => :p2); END;",
                bindvars,
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    console.log(result.outBinds);
                    rslt = JSON.stringify(result.outBinds);
                    //console.log(JSON.parse(rslt));
                    res.json(JSON.parse(rslt));

                    doRelease(connection);
                });
        });

});


function doRelease(connection) {
    connection.close(
        function (err) {
            if (err) {
                console.error(err.message);
            }
        });
};

var distDir = '/Users/abhilashakanitkar/Documents/STUDY/DataBasesMgt' + "/DMFinalProject/";
app.use(express.static(distDir));


// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");

