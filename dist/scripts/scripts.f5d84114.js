"use strict";angular.module("pointoApp",["ngResource","ngRoute","ngSanitize","firebase","chart.js"]).constant("FIREBASE_URL","https://pointo.firebaseio.com/").config(["$routeProvider",function(a){a.when("/",{templateUrl:"views/main.html",controller:"MainCtrl"}).when("/:sessionID",{templateUrl:"views/story.html",controller:"StoryCtrl"}).otherwise({redirectTo:"/"})}]),angular.module("pointoApp").directive("globalHeader",function(){return{templateUrl:"../views/_header.html"}}).filter("num",function(){return function(a){return parseInt(a,10)}}),angular.module("pointoApp").factory("viewFactory",function(){var a={};return a.errors={noSession:!1,noSessionJoin:!1,registerError:!1,updateAccount:!1,wrongPasscode:!1,changePasscode:!1,permission:!1},a.loading={create:!1,join:!1,joinSpectator:!1,login:!1,register:!1,updateAccount:!1,changePasscode:!1},a.getErrors=function(){return a.errors},a.setErrors=function(b,c){a.errors[b]=c},a.getLoading=function(){return a.loading},a.setLoading=function(b,c){a.loading[b]=c},{getErrors:a.getErrors,setErrors:a.setErrors,getLoading:a.getLoading,setLoading:a.setLoading}}),angular.module("pointoApp").factory("accountFactory",["$firebaseObject","$rootScope","$window","$timeout","FIREBASE_URL","viewFactory",function(a,b,c,d,e,f){var g,h,i={user:{data:null,name:"",logout:null,account:!1,sessions:[]},inited:!1},j=new Firebase(e),k=!1;return i.init=function(){i.inited||(j.onAuth(i.authDataCallback),i.user.data=j.getAuth(),i.user.logout=i.logout,i.user.account=null!==i.user.data&&"password"===i.user.data.auth.provider?!0:!1,i.inited=!0)},i.getUser=function(){return i.user},i.register=function(a,c){k=!0,j.createUser({email:a,password:c},function(d,e){d?(console.log("Error creating user: ",d),f.setErrors("registerError",d.message)):(j.authWithPassword({email:a,password:c},i.authHandler),console.log("Successfully created user with uid: ",e.uid)),b.$apply(function(){f.setLoading("register",!1)})})},i.login=function(a,b){j.authWithPassword({email:a,password:b},i.authHandler)},i.logout=function(){j.unauth(),i.user.account=!1,c.location.assign("#/")},i.setUser=function(a,b){d(function(){i.user.data=a,i.user.account=a?!0:!1,i.user.name=b.name})},i.authDataCallback=function(a){a?(g=j.child("users").child(a.uid),g.once("value",function(b){var c=b.val();c&&(console.log("User "+a.uid+" is logged in with "+a.provider),d(function(){i.setUser(a,c)}))}),h=j.child("sessions"),h.on("value",function(b){var c=b.val();c&&d(function(){i.user.sessions=[],angular.forEach(c,function(b,c){b.owner===a.uid&&(b.sessionId=c,i.user.sessions.push(b))})})})):(console.log("User is logged out"),i.setUser(null,""),i.inited=!1)},i.authHandler=function(a,b){a?(console.log("Login Failed!",a),i.setUser(null,"")):(console.log("Authenticated successfully with payload:",b),k&&j.child("users").child(b.uid).set({name:b.password.email.replace(/@.*/,"")}),i.authDataCallback(b),i.setUser(b,"")),f.setLoading("login",!1)},i.anonymousLogin=function(){j.authAnonymously(function(a){a?console.log("Login Failed!",a):console.log("Logged in as Anonymous")})},i.getUserName=function(){return j.child("users").child(i.user.data.uid)},i.updateAccount=function(a){j.child("users").child(i.user.data.uid).set({name:a.name}),d(function(){i.user.name=a.name,f.setLoading("updateAccount",!1)},250)},{init:i.init,getUser:i.getUser,getUserName:i.getUserName,login:i.login,register:i.register,updateAccount:i.updateAccount}}]),angular.module("pointoApp").factory("storyFactory",["$firebaseObject","$firebaseArray","$window","$timeout","FIREBASE_URL","utilsFactory","viewFactory","accountFactory",function(a,b,c,d,e,f,g,h){var i={},j=new Firebase(e);return i.user={key:null,name:null,points:{},"new":!1,leader:!1,spectator:!1,redirect:!1},i.storyPointSet=[{text:0,value:0},{text:"½",value:.5},{text:1,value:1},{text:2,value:2},{text:3,value:3},{text:5,value:5},{text:8,value:8},{text:13,value:13},{text:20,value:20},{text:40,value:40},{text:100,value:100},{text:"?",value:-2},{text:"X",value:-1}],i.storyPointValues=[0,.5,1,2,3,5,8,13,20,40,100],i.session={},i.participants={},i.statistics={},i.sessionID=null,i.createSession=function(a){var b,c=f.randomID(1e5,999999),d=j.child("sessions").child(c);j.child("sessions").once("value",function(e){e.child(c).exists()?i.createSession(a):(b={users:"",voteStatus:0,score:0,owner:null,passcode:a.passcode},null!==h.getUser().data&&"anonymous"!==h.getUser().data.provider&&(b.owner=h.getUser().data.uid),d.set(b,function(b){b?console.log(b):i.joinSession(c,a.name,!1,!0)}))})},i.enterSession=function(a,b,c,d){j.child("sessions").once("value",function(e){e.child(a).exists()?(g.setErrors("noSession",!1),i.joinSession(a,b,c,d)):(g.setErrors("noSession",!0),g.setLoading("join",!1),g.setLoading("joinSpectator",!1))})},i.joinSession=function(a,b,c,d){var e=j.getAuth();i.user.key&&null!==e?i.addUser(a,b,c,e.uid,d):h.getUser().account?i.addUser(a,h.getUser().name,c,h.getUser().data.uid,d):j.authAnonymously(function(e,f){e?console.log("Login Failed!",e):(console.log("Logged in as Anonymous"),i.addUser(a,b,c,f.uid,d))}),i.sessionID=a},i.joinSessionWithPasscode=function(a){return g.setErrors("wrongPasscode",!1),j.child("sessions").child(a)},i.addUser=function(a,b,g,h,k){var l=new Firebase(e+"sessions/"+a+"/users"),m={text:-1,value:-1};b=b.toString(),l.child(h).set({name:b.toString(),points:m,spectator:g},function(e){e?console.log(e):(i.user.key=h,i.user.name=b,i.user.redirect=k,i.user.points=m,i.user.spectator=g,f.hasStorage()&&(localStorage[h]=b),l.child(h).onDisconnect().remove(),j.child("sessions").child(a).child("users").once("value",function(b){b.numChildren()<=1&&j.child("sessions").child(a).update({voteStatus:0,score:0},i.errorCallback)}),j.child("sessions").child(a).child("voteStatus").on("value",function(b){0===b.val()&&j.child("sessions").child(a).child("users").child(i.user.key).update({points:{text:-1,value:-1}},i.errorCallback)}),d(function(){j.child("sessions").child(a).once("value",i.onSessionChange)},300),j.child("sessions").child(a).on("value",i.onSessionChange),c.location.assign("#/"+a))})},i.onSessionChange=function(a){var b,c,d,e,g=a.val().users,h={data:[[0,0,0,0,0,0,0,0,0,0,0]],participants:0,score:0},j=0,k=0;i.statistics={};for(b in g){for(c=g[b].points,d=0;d<i.storyPointSet.length-2;d++)i.storyPointSet[d].value===c.value&&(h.data[0][d]+=1);h.participants+=1}for(e=h.data[0],d=0;d<e.length;d++)e[d]>0&&(k+=i.storyPointSet[d].value,j++);h.score=j>0?f.getClosestNumber(i.storyPointValues,k/j):-1,i.statistics=h},i.sessionExists=function(){var a=j.child("sessions");return a},i.isLoggedIn=function(){var a=j.getAuth();return a&&f.hasStorage()?(i.user.key=a.uid,i.user.name=localStorage[a.uid]||"Anonymous",i.user.spectator=!1,!0):!1},i.anonymousLogin=function(){j.authAnonymously(function(a){a?console.log("Login Failed!",a):console.log("Logged in as Anonymous")})},i.getSession=function(c){return i.session=a(j.child("sessions").child(c)),i.participants=b(j.child("sessions").child(c).child("users")),{session:i.session,participants:i.participants}},i.participateStatus=function(){var a=j.child("sessions").child(i.sessionID).child("users").child(i.user.key);i.user.spectator=!i.user.spectator,a.update({spectator:i.user.spectator,points:{text:-1,value:-1}},i.errorCallback)},i.setVote=function(a){var b=j.child("sessions").child(i.sessionID).child("users").child(i.user.key);b.update({points:{text:a.text.toString(),value:parseFloat(a.value)}},i.errorCallback),i.user.points=a},i.revealVotes=function(){var a=j.child("sessions").child(i.sessionID);a.update({voteStatus:1},i.errorCallback)},i.clearVotes=function(){var a=j.child("sessions").child(i.sessionID),b={text:-1,value:-1};a.update({voteStatus:0},i.errorCallback),a.child("users").child(i.user.key).update({points:b},i.errorCallback),i.user.points=b},i.getVoteStatistics=function(){return i.statistics},i.getStoryPointSet=function(){return i.storyPointSet},i.changeName=function(a){var b=j.child("sessions").child(i.sessionID).child("users").child(i.user.key);a=a.toString(),b.update({name:a},i.errorCallback),i.user.name=a,f.hasStorage()&&(localStorage[i.user.key]=a)},i.changePasscode=function(a){var b=j.child("sessions").child(i.sessionID);b.update({passcode:a},function(a){d(function(){g.setErrors("changePasscode",!0),g.setLoading("changePasscode",!1)}),i.errorCallback(a)})},i.leadSession=function(){var a=j.child("sessions").child(i.sessionID).child("users").child(i.user.key);i.user.leader=!i.user.leader,a.update({leader:i.user.leader},i.errorCallback)},i.setTimer=function(a){return j.child("sessions").child(i.sessionID).update({timer:a},i.errorCallback)},i.getTimer=function(a){return j.child("sessions").child(a).child("timer")},i.addStory=function(a){var b={name:a,points:-999};j.child("sessions").child(i.sessionID).child("stories").push(b)},i.getStories=function(a){return j.child("sessions").child(a).child("stories")},i.setActiveStory=function(a){j.child("sessions").child(i.sessionID).update({activeStory:a},i.errorCallback)},i.saveStory=function(a,b){b.points=parseFloat(b.points,10),j.child("sessions").child(i.sessionID).child("stories").child(a).set(b)},i.deleteStory=function(a){j.child("sessions").child(i.sessionID).child("stories").child(a).remove()},i.errorCallback=function(a){null!==a&&"PERMISSION_DENIED"===a.code&&g.setErrors("permission",!0)},{createSession:i.createSession,joinSession:i.enterSession,joinSessionWithPasscode:i.joinSessionWithPasscode,sessionExists:i.sessionExists,getSession:i.getSession,isLoggedIn:i.isLoggedIn,anonymousLogin:i.anonymousLogin,user:i.user,setVote:i.setVote,revealVotes:i.revealVotes,clearVotes:i.clearVotes,getVoteStatistics:i.getVoteStatistics,getStoryPointSet:i.getStoryPointSet,setTimer:i.setTimer,getTimer:i.getTimer,addStory:i.addStory,getStories:i.getStories,setActiveStory:i.setActiveStory,saveStory:i.saveStory,deleteStory:i.deleteStory,changeName:i.changeName,changePasscode:i.changePasscode,leadSession:i.leadSession,participateStatus:i.participateStatus}}]),angular.module("pointoApp").factory("utilsFactory",function(){var a={};return a.randomID=function(a,b){return Math.floor(Math.random()*(b-a+1)+a)},a.hasStorage=function(){try{return"localStorage"in window&&null!==window.localStorage}catch(a){return!1}},a.getClosestNumber=function(a,b){var c,d=0,e=1e3;for(d in a){var f=Math.abs(b-a[d]);e>f&&(e=f,c=a[d])}return parseFloat(c)},{randomID:a.randomID,hasStorage:a.hasStorage,getClosestNumber:a.getClosestNumber}}),angular.module("pointoApp").directive("focusOn",["$timeout",function(a){return function(b,c,d){b.$on(d.focusOn,function(){a(function(){c[0].focus()})})}}]),angular.module("pointoApp").controller("MainCtrl",["$scope","$timeout","viewFactory","accountFactory","storyFactory",function(a,b,c,d,e){d.init(),a.authUser=d.getUser,a.name=a.authUser,a.joinName=a.authUser,a.passcode=null,a.passcodeNeeded=!1,a.sessionID=null,a.spectator=!1,a.errors=c.getErrors,a.loading=c.getLoading,a.auth={state:{login:!1,register:!1},login:{email:"",password:""},register:{email:"",password:""}},c.setLoading("create",!1),c.setLoading("join",!1),c.setLoading("joinSpectator",!1),c.setErrors("noSession",!1),a.createSession=function(){if(!a.loading().create){a.loading().create=!0;var b=a.authUser().account?a.authUser().name:a.name().name;e.createSession({name:b,passcode:a.passcode})}},a.joinSession=function(d,f){if(!a.loading().join){a.spectator?c.setLoading("joinSpectator",!0):c.setLoading("join",!0),c.setErrors("noSession",!1),c.setErrors("wrongPasscode",!1);var g=d||a.sessionID;e.sessionExists(g).once("value",function(d){d.val()&&b(function(){if(d.child(g).exists()){var b=d.child(g).val();f?parseInt(a.passcode)===parseInt(b.passcode)?a.enterSession(g):(c.setErrors("wrongPasscode",!0),c.setLoading("join",!1),c.setLoading("joinSpectator",!1)):"undefined"==typeof b.passcode||null!==a.authUser().data&&b.owner===a.authUser().data.uid?a.enterSession(g):(a.passcodeNeeded=!0,a.$broadcast("passcodeIsNeeded"),c.setLoading("join",!1),c.setLoading("joinSpectator",!1))}else c.setErrors("noSession",!0),c.setLoading("join",!1),c.setLoading("joinSpectator",!1)})})}},a.enterSession=function(b){var c=a.authUser().account?a.authUser().name:a.joinName().name;e.joinSession(b,c,a.spectator,!0),setTimeout(function(){a.$apply()},1e3)},a.cancelPasscodeJoining=function(){a.passcodeNeeded=!1},a.formLogin=function(){a.auth.state.login=!0,a.auth.state.register=!1,a.$broadcast("enterLogin")},a.formRegister=function(){a.auth.state.register=!0,a.auth.state.login=!1,a.$broadcast("enterRegister")},a.login=function(){c.setLoading("login",!0),c.setErrors("registerError",!1),d.login(a.auth.login.email,a.auth.login.password)},a.register=function(){c.setLoading("register",!0),c.setErrors("registerError",!1),d.register(a.auth.register.email,a.auth.register.password)}}]),angular.module("pointoApp").controller("StoryCtrl",["$scope","$routeParams","$window","$timeout","storyFactory","accountFactory","viewFactory",function(a,b,c,d,e,f,g){var h,i,j=b.sessionID;(1e5>j||j>999999)&&c.location.assign("#/"),a.sessionID=j,a.view=0,f.init(),a.errors=g.getErrors,a.loading=g.getLoading,a.authUser=f.getUser,a.stats={options:{scaleShowVerticalLines:!1,showTooltips:!1,scaleFontSize:14},labels:[0,"½",1,2,3,5,8,13,20,40,100],data:[[0,0,0,0,0,0,0,0,0,0,0]],colours:["#16a085","#1abc9c"]},a.countdown={labels:["",""],data:[0,100],options:{animationEasing:"linear",percentageInnerCutout:85},colours:["#16a085","#e5e5e5"]},a.initSession=function(){a.view=1,a.name="",a.spectator=!1,a.shareURL=c.location.host+"/#/"+a.sessionID,a.isFlipped=!1,h=e.getSession(j),a.user=e.user,a.participants=h.participants,a.session=h.session,a.newName=e.user.name,a.newPasscode="",a.stories={newStory:"",list:{},editMode:!1},a.timer={value:15,counter:15,running:!1},a.timerStarted=!1,e.getTimer(a.sessionID).on("value",function(b){a.timer=null!==b.val()?b.val():a.timer,null!==a.timer&&!a.timerStarted&&a.timer.running&&a.timer.counter>0&&(i=setInterval(function(){a.timer.counter--,a.countdown.data[1]=100/(a.timer.value-2)*(a.timer.counter-2),a.countdown.data[1]>0?a.countdown.data[0]=100-a.countdown.data[1]:(a.countdown.data[0]=100,a.countdown.data[1]=0),a.timer.counter<=0&&a.stopTimer(!0),a.timerStarted=!0,a.$apply()},1e3))}),a.statistics=e.getVoteStatistics,a.$watch("statistics()",function(b){a.stats.data=b.data}),e.getStories(j).on("value",function(b){a.stories.list=b.val()}),a.storypoints=e.getStoryPointSet()},a.autoJoinSession=function(){e.isLoggedIn()?e.user.redirect?a.initSession():(a.authUser().account?f.getUserName().once("value",function(a){var b=a.val();b&&e.joinSession(j,b.name,!1)}):e.joinSession(j,e.user.name,e.user.spectator),a.initSession()):d(function(){a.view=2})},a.joinSession=function(){a.passcodeNeeded?e.joinSessionWithPasscode(j).once("value",function(b){var c=b.val();d(function(){c?parseInt(c.passcode)===parseInt(a.passcode)?a.authUser().account?a.autoJoinSession():(e.joinSession(j,a.name,a.spectator),a.initSession()):(console.log("you shall NOT pass"),g.setErrors("wrongPasscode",!0)):g.setErrors("noSessionJoin",!0)})}):(e.joinSession(j,a.name,a.spectator),a.initSession())},a.vote=function(b){a.user.spectator||e.setVote(b)},a.revealVotes=function(){0===a.session.voteStatus&&a.user.leader&&(a.revealed=!0,a.flip(),e.revealVotes())},a.clearVotes=function(){1===a.session.voteStatus&&a.user.leader&&(a.revealed=!1,a.flip(),e.clearVotes())},a.stopTimer=function(b){d(function(){clearInterval(i),a.timerStarted=!1,a.countdown.data=[0,100],b&&(0===a.session.voteStatus&&(a.revealed=!0,a.flip(),e.revealVotes()),a.timer.running=!1,a.user.leader&&e.setTimer(a.timer))})},a.toggleTimer=function(){a.timer.running?(a.timer.running=!1,a.stopTimer(),a.user.leader&&e.setTimer(a.timer)):(console.log(a.timer.value),a.timer.value>=5&&a.user.leader&&(a.timer.running=!0,a.timer.counter=parseInt(a.timer.value),e.setTimer(a.timer)))},a.addStory=function(){a.session.owner===a.authUser().data.uid&&(e.addStory(a.stories.newStory),a.stories.newStory="")},a.setActiveStory=function(b,c,d){b.preventDefault(),d||a.session.owner!==a.authUser().data.uid||e.setActiveStory(c)},a.saveStoryEdit=function(b,c,d){"undefined"!=typeof b&&b.preventDefault(),a.session.owner===a.authUser().data.uid&&(d.editMode=!1,e.saveStory(c,d))},a.deleteStory=function(b,c){b.preventDefault(),a.session.owner===a.authUser().data.uid&&e.deleteStory(c)},a.editStoryKeyPress=function(b,c,d){(13===b.which||27===b.which)&&(d.editMode=!1,a.session.owner===a.authUser().data.uid&&a.saveStoryEdit(b,c,d))},a.changeName=function(){e.changeName(a.newName)},a.changePasscode=function(){a.session.owner===a.authUser().data.uid&&(g.setErrors("changePasscode",!1),g.setLoading("changePasscode",!0),e.changePasscode(a.newPasscode))},a.leadSession=function(){e.leadSession()},a.participateStatus=function(){e.participateStatus()},a.flip=function(){a.isFlipped=!a.isFlipped},e.sessionExists(j).once("value",function(b){if(b.val())if(b.child(j).exists()){var f=b.child(j).val();"undefined"==typeof f.passcode||null!==a.authUser().data&&f.owner===a.authUser().data.uid||e.user.redirect?a.autoJoinSession():d(function(){a.passcodeNeeded=!0,a.view=2})}else c.location.assign("#/")})}]),angular.module("pointoApp").controller("AccountCtrl",["$scope","$document","viewFactory","accountFactory",function(a,b,c,d){d.init(),a.authUser=d.getUser,a.errors=c.getErrors,a.loading=c.getLoading,a.accountView=!1,a.accountForm={name:""},a.toggleAccount=function(b){b.preventDefault(),a.accountView=!a.accountView},a.updateAccount=function(){c.setLoading("updateAccount",!0),d.updateAccount(a.accountForm)},a.closeAccountPanel=function(){a.$apply(function(){a.accountView=!1})},b.bind("keyup",function(b){27===b.which&&a.closeAccountPanel()}),b.bind("click",function(b){null===b.target.closest(".account .account-settings-panel")&&null===b.target.closest(".account .fakelink")&&a.closeAccountPanel()})}]);