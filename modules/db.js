/*var fs = require("fs");
var sqlite3 = require("sqlite3").verbose();

var DB_DIR = "./scores.db";
var VERSION = "1.0";

var ID = "_id";
var NAME = "name";
var SCORE = "score";

module.exports = DBHelper;

function DBHelper() {
    //fs.unlinkSync(DB_DIR);
    var exists = fs.existsSync(DB_DIR);
    if (!exists) {
        console.log("Creating DB file.");
        fs.openSync(DB_DIR, "w");
    }
    var db = new sqlite3.Database(DB_DIR);
    if (!exists) {
        db.run("create table SCORES(" +
        ID + " integer primary key autoincrement," +
        NAME  + " text," +
        SCORE + " integer)");
    }
    this.getDB = function() {
        return db;
    };
    this.closeDB = function() {
        db.close();
    };
    this.addScore = function(name, score, callback) {
        db.serialize(function() {
            db.get('select * from SCORES where name="' + name + '"', function(err, res) {
                var old_score;
                if (res == null) {
                    db.run('insert or ignore into SCORES (' + NAME + ',' + SCORE 
                        + ') values (' + name + ',0)');
                    old_score = 0;
                } else {
                    old_score = res[SCORE];
                }
                score += old_score;
                db.run('update SCORES set ' + SCORE + '=' + score + 'where ' + NAME + '=' + name);
                callback();
            });
        });
    };
    this.getScore = function(name, callback) {
        db.serialize(function() {
            db.get('select * from SCORES where name="' + name + '"', function(err, res) {
                if (res == null) {
                    db.run('insert or ignore into SCORES (' + NAME + ',' + SCORE 
                        + ') values (' + name + ',0)');
                    callback(0);
                } else {
                    callback(res[SCORE]);
                }
            });
        });
    };
}*/