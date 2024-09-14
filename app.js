require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require('mongoose');
const _=require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// @ = %40
mongoose.connect("mongodb+srv://shahzad:"+process.env.MONGODB_PASSWORD+"@cluster0.o29naat.mongodb.net/todolistDB");

const todoListSchema=new mongoose.Schema({
	name:String
});

const Item=mongoose.model("Item",todoListSchema);

const item1=new Item({
	name:"Welcome to your todolist!"
});

const item2=new Item({
	name:"Hit the + button to add a new item."
});

const item3=new Item({
	name:"<-- Hit this to delete an item."
});

const defaultItems=[item1,item2,item3];

// For Custom list
const customListSchema=new mongoose.Schema(
	{
	name:String,
	items:[todoListSchema]
	}
);
const List=mongoose.model("List",customListSchema);


app.get("/:customListName",function(req,res)
{
	console.log("List Name: "+req.params.customListName)
	if(req.params.customListName!=="about")
	{
		const customListName=_.capitalize(req.params.customListName);
		List.findOne({name:customListName}).then(function(foundList){
			if(foundList===null)
				{
					const list=new List({
						name:customListName,
						items:defaultItems
					});
					list.save();
					res.redirect("/"+customListName);
				}
				else{
					res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
				}
		});
	}
	else{
		res.render("about");
	}

});

app.get("/", function(req, res) {

	Item.find({}).then(function(foundItems){
		if(foundItems.length===0)
		{
			Item.insertMany(defaultItems);
			res.redirect("/");
		}
		else{
			res.render("list", {listTitle: "Today", newListItems:foundItems});
		}
	})
});


// Adding Item
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  
  const item=new Item({
	name:itemName
  });
  if(listName==="Today")
  {
	item.save();
	res.redirect("/");
  }
  else{
	List.findOne({name:listName}).then(function(foundList){
		foundList.items.push(item);
		foundList.save();
		res.redirect("/"+listName);
	})
  }
});

// Deleting an Item
app.post("/delete",function(req,res)
{
	const checkedItemId=req.body.checkbox;
	const listName=req.body.listName;
	console.log(listName);

	if(listName==="Today")
	{
	Item.findByIdAndDelete(checkedItemId)
          .then(deletedItem => {
            if (deletedItem) {
              console.log('Deleted item:', deletedItem.name);
			  res.redirect("/");
            } else {
              console.log('Item not found.');
            }
          })
          .catch(err => {
            console.error('Error deleting item:', err);
          });
	}
	else{
		
		List.findOneAndUpdate(
			{ name: listName }, 
			{ $pull: { items: { _id: checkedItemId } } }, 
			{new: true, upsert: true}
		)
		.then(foundList => {
			if (!foundList) {
				console.log("List not found.");
				res.send("List not found.");
			} else {
				console.log("Item deleted successfully from "+listName+" todolist")
				res.redirect("/" + listName);
			}
		})
		.catch(err => {
			console.log(err);
			res.send("Error updating list.");
		});
	}
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
