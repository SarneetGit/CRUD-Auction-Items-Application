const inquirer = require("inquirer");
const mysql = require("mysql");
const connection = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "password",
    database: "auction_db"
});

var itemsList = []
var itemToAdd = ''
var bidItem = 'empty'
var itemsBid = {}
var bidAmount = 0

function authenticateIdentity() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'userInfo',
            message: "Hi there, are you a new or returning user?",
            choices: ['New User', 'Returning User']
        },
        {
            message: 'Please input your Username:\n',
            type: 'input',
            name : 'username'
        },
        {
            message: 'Please input your Password:\n',
            type: 'password',
            name: 'password',
            mask : '*'
        }]).then(answers => {
            let selection = answers.userInfo
            let username = answers.username
            let password = answers.password
    
            if (selection === 'New User') {
                connection.query('INSERT INTO userpass (username, pw) VALUES (?, ?);', [username, password], (err, resp) =>{
                    if (err) {
                        throw err
                    }
                    console.log(`Thanks for joining ${username}!\n`)
                    askForInput()
                    // connection.end()
                })
            }
            else if (selection === 'Returning User') {
                connection.query(`SELECT IF( EXISTS(SELECT * FROM userpass WHERE username = ? and pw = ?), 1, 0) AS 'Exist';`, [username, password], (err, resp) => {
                    if (err) {
                        throw err
                    }
                    let exist = resp[0].Exist
                    if (exist === 1) {
                        console.log(`Welcome back ${username}!\n`)
                        askForInput()
                    }
                    else {
                        console.log(`Your username and/or password does not exist in my database. Please try selecting the "New User" option. \n`)
                        authenticateIdentity()
                    }                    
                })    
            }            
    })
}

function connectAndExecute(toCall, input, input2) {
    if (connection.threadId) {
        if (input) {
            toCall(input, input2)
        }
        else {
            toCall()
        }
    }
    else {
        connection.connect(function (err) {
            if (err) {
                console.log('Line 16 made it here')
                console.error(err)
            } else {
                // console.log(`You are connected ${connection.threadId}`)
                if (input) {
                    toCall(input, input2)
                }
                else {
                    toCall()
                }
            }
        });
    }
}

function insertItem(input) {
    connection.query("INSERT INTO item (item_name) VALUES (?) ", [input], function (err) {
        if (err) {
            throw err
        };
        console.log(`${input} was added!`)
    })
    connection.end();
}

function insertBid(item, bid) {
    connection.query("INSERT INTO bid (item_id, price) values ((SELECT ID from item WHERE item_name = ?), ?);", [item, bid], function (err) {
        if (err) {
            throw err
        };
        console.log(`${item} was added at a bid price of ${bid}!`)
    })
    connection.end();
}

function getItems(callback) {
    connection.query('SELECT i.item_name AS "Name", IFNULL(b.price, 0) AS "Price" FROM item i LEFT JOIN bid b ON i.ID = b.item_ID order by b.price asc', function (err, resp) {
        if (err) {            
            throw err
        }
        for (let i of resp) {
            let item = i.Name;
            let price = i.Price
            //Only want distinct items in this list
            if (itemsList.includes(item)) {
                itemsBid[item] = price
            }
            else {
                itemsList.push(item)
                itemsBid[item] = price                
            }
        }
        // console.log("line 52" + itemsList)
        // connection.end() //Comment out later if you decide to add bid amount functinoality
        callback()
    })   
}

function askForInput() {
    inquirer
        .prompt(questions[0])
        .then(answers => {
            //Depending on Post or Bid, follow logical paths below
            if (answers.choice === "POST AN ITEM") {
                //Prompt input on item to be added
                inquirer.prompt(questions[1]).then( answers => {
                    //add inputted item to DB
                    itemToAdd = answers.itemName
                    connectAndExecute(insertItem, itemToAdd)
                })
            } else if (answers.choice === "BID ON AN ITEM") {
                connectAndExecute(getItems, inquirerCallBack)
                // console.log("Line 107 " + itemsList)
                // inquirer.prompt(questions[2])  questions[2], questions[3]
            }
        })
        .catch(err => console.error(err));
}

function inquirerCallBack() {
    // console.log("Line 58" + itemsList)
    inquirer.prompt(questions[2]).then(answers => {
        bidItem = answers.bidItem       
        inquirer.prompt(questions[3]).then(answers => {
            bidAmount = answers.bidAmount 
            connectAndExecute(insertBid, bidItem, bidAmount);                              
        })        
    })
}

var questions = [{
        type: "list",
        name: "choice",
        choices: ["POST AN ITEM", "BID ON AN ITEM"],
        message: "What would you like to do?"
    },
    {
        type: 'input',
        name: 'itemName',
        message: "What item do you want to Post?"        
    },
    {
        type: 'list',
        name: 'bidItem',
        message: "What would you like to bid?",
        choices: itemsList
    },
    {
        type: 'number',
        name: 'bidAmount',
        message: `How much would you like to bet on this item?`,
        validate : function (value) {
            if (value <= 0) {
                return `Please enter an amount for the bid greater than 0`
            }
            else if (value <= itemsBid[bidItem]) {
                return `Your bid is lower than the highest bid ($${itemsBid[bidItem]}) for the ${bidItem}`
            }
            return true
        }
    }
]

authenticateIdentity()
