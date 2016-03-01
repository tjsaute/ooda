if (Meteor.isClient) {
  // Client Code
  
  Template.todos.helpers({ 
  'todo': function(){
    var currentList = this._id;
    var currentUser = Meteor.userId();
    return Todos.find({createdBy: currentUser, listId: currentList}, {sort: {createdAt: -1}});    
  }
});

  Template.addTodo.events({
    'submit form': function(event){
      event.preventDefault();
      var todoName = $('[name="todoName"]').val();
      var currentList = this._id;
      Meteor.call('addListItem', todoName, currentList, function(error){
        if(error){
          console.log(error.reason);
        }else{
          $('[name=listName]').val('');
        }
      });
               
/*****************************************      
      var currentUser = Meteor.userId();
      Todos.insert({
        name: todoName,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
        listId: currentList
      });
      $('[name="todoName"]').val('');
*****************************************/      
    }
  });
  
  Template.lists.helpers({
    'list': function(){
      var currentUser = Meteor.userId();
      return Lists.find({createdBy: currentUser}, {sort: {name: 1}});
    }
  });
 
 
  Template.register.events({
    'submit form': function(){
      event.preventDefault();
    }    
  });

// Stert JQuery Error Handling ****************

  $.validator.setDefaults({
      rules: {
        email: {
          required: true,
          email: true
        },
        password: {
          required: true,
          minlength: 1
        }
      },
      messages: {
        email: {
          required: "You must enter an email address.",
          email: "You've entered an invalid email address."
        },
        password: {
          required: "You must enter a password.",
          minlength: "Your password must be at least {0} characters."
        }
      }    
  });

  Template.login.onCreated(function(){
      console.log("Created Login Template")
  });
  
  Template.login.onRendered(function(){
      var validator = $('.login').validate({
          submitHandler: function(event){
            var email = $('[name=email]').val();
            var password = $('[name=password]').val();
            Meteor.loginWithPassword(email, password, function(error){
              if(error) {
                if (error.reason == "User not found"){
                  validator.showErrors({
                    email: "Email address doesn't exist"
                  });
                }
                if (error.reason == "Incorrect password"){
                  validator.showErrors({
                    password: "Invalid password"
                  });
                }    
              }else {
                var currentRoute = Router.current().route.getName();         
                if (currentRoute == "login"){ 
                  Router.go('home');
                }        
              }    
            });
          }
      });
  });
  
  Template.login.onDestroyed(function(){
      console.log("Destroyed Login Template")
  });
      
   Template.register.onRendered(function(){
    var validator = $('.register').validate({
        submitHandler: function(event){
          var email = $('[name=email]').val();
          var password = $('[name=password]').val();
          Accounts.createUser({
            email: email,
            password: password
          }, function(error){
            if(error) {
              if(error.reason == "Email already exists."){
                validator.showErrors({
                  email: " Email already taken nub"
                });
              }
            }else {
              Router.go('home');
            }                
          });  
        }
    });    
  });   
      

//  End JQuery Error Handling ****************

  Template.login.events({
    'submit form': function(){
      event.preventDefault();      
    }  
  });     
  
  Template.addList.events({
    'submit form': function(event){
      event.preventDefault();
      var listName = $('[name="listName"]').val();
      Meteor.call('createNewList', listName, function(error, results){
        if(error){
          console.log(error.reason);
        }else{
          Router.go('listPage', {_id: results});
          $('[name=listName]').val('');
        }
      });
            
/************************* Add to Server side          
      var currentUser = Meteor.userId();
      Lists.insert({
        name: listName,
        createdBy: currentUser
      }, function(error, results){
        Router.go('listPage', {_id: results});   
      });
      $('[name="listName"]').val('');
 **************************/
 
    }      
  });

  Template.todoItem.events({
    'click .delete-todo': function(event){
     event.preventDefault();
     var documentId = this._id;
     var confirm = window.confirm("Delete " + this.name + "?");
     if (confirm){
        Todos.remove({ _id: documentId});       
     }
    },
    'keyup [name=todoItem]': function(event){
      if(event.which == 13 || event.which == 27){
        $(event.target).blur();
      }else{
        var documentId = this._id;
        var todoItem = $('[name="todoName"]').val();
        Todos.update({_id: documentId}, {$set: {name: todoItem}});
      }
    },
    'change [type=checkbox]': function(){
      var documentId = this._id;
      var isCompleted = this.completed;
      if(isCompleted){
        Todos.update({_id: documentId}, {$set: {completed: false }});
      }else{
        Todos.update({_id: documentId}, {$set: {completed: true}});
      }
    }  
  });
  
  Template.navigation.events({
    'click .logout': function(event){
      event.preventDefault();
      Meteor.logout();
      Router.go('login')
    }            
  });  
  
  Template.todoItem.helpers({
    'checked': function(){
      var isCompleted = this.completed;
      if(isCompleted){
      return "checked"; 
      }else{
        return"";
      }
    }
  });
 
 Template.todosCount.helpers({
  'totalTodos': function(){
      var currentList = this._id;
      return Todos.find({listId: currentList}).count();
   },
  'completedTodos': function(){
    var currentList = this._id;    
    return Todos.find({completed: true, listId: currentList}).count();
   }
 });
    
}
  
// Server side code
if (Meteor.isServer) {
      // Server Code
      
    Meteor.methods({
      createNewList: function(listName){
        var currentUser = Meteor.userId();
  //      console.log(check(listName, String));
 //       check(listName, String);
        if (listName == ""){
          listName = "Untitled";
        }
        var data = {
          name: listName,
          createdBy: currentUser          
        }
        if (!currentUser){
          throw new Meteor.Error("not-logged-in", "You're not logged in stupid");
        }
        return Lists.insert(data);             
      },

      addListItem: function(todoName, currentList){
        var currentUser = Meteor.userId();
        if(!currentUser){
          throw new Meteor.Error("not-logged-in", "You're not logged in stupid");
        }
        if(todoName == ''){
          todoName ="No Name List Item";
        }
        var data = {
          name: todoName,
          completed: false,
          createdBy: currentUser,
          createdAt: new Date(),
          listId: currentList
        }
      return Todos.insert(data);    
      }

    });      
      
}

// Create the Mongo Database
Todos = new Mongo.Collection('todos');
Lists = new Mongo.Collection('lists');


// Route definitions
Router.configure({
  layoutTemplate: 'main'
});

/*****
Router.route('/', {
  name: 'home',
  template: 'home'
});
*****/
console.log("about to enter home / root");
Router.route('/', {
  name: 'home',
  template: 'home'
});

Router.route('/lists/:_id', {
  name: 'listPage',
  template: 'listPage',
  data: function(){
    var currentList = this.params._id;
    var currentUser = Meteor.userId();
    return Lists.findOne({_id: currentList, createdBy: currentUser});
  },
  onBeforeAction: function(){
    var currentUser = Meteor.userId();
      console.log("onBeforeAction triggered");  
    if(currentUser){
      this.next();
    } else {
      this.render("login");
    }                  
  }
  
  ,
  onAfterAction: function(){
    console.log("onAfterAction triggered");
  } ,
  onRun: function(){
    console.log("onRun triggered");
    this.next();
  },
  onRerun: function(){
    console.log("onRerun triggered");
  },
  onStop: function(){
    console.log("onStop triggered");
  }
  
  
  
  
  
  
});

Router.route('/register');

Router.route('/login');

