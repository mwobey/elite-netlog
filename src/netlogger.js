const EventEmitter = require('events');
const chokidar = require("chokidar");
const fsreverse = require("fs-reverse");
const EventData = require("./event_data");

class Netlogger extends EventEmitter {
    constructor(log_dir, start_from=new Date()) { //TODO: last_logged_event is undefined in readfile
        super();
        this.last_logged_event = start_from;
        this.current_system = "";
        this.log_dir = log_dir;

        this.watcher = chokidar.watch(log_dir, {
            ignored: 'debug*',
            persistent: true,
            awaitWriteFinish: true
        });

        this.watcher.on('add', this.__read_file__);
        this.watcher.on('change', this.__read_file__);
    }//constructor

    __read_file__ ( filepath ) {
        var file_date = Netlogger.filename_to_date(filepath);
        var file_handle = fsreverse(filepath);
        file_handle.on('data', (line) => {
          var parsed_line = /\{(\d{2}):(\d{2}):(\d{2})\} (System|Commander Put)\s*(.+)/.exec(line);
          var queued_events = [];
          if ( parsed_line ) {
            var event_data = new EventData(...parsed_line.slice(1));
            file_date.setUTCHours(event_data.h, event_data.m, event_data.s);
            if ( file_date > this.last_logged_event ) {
                queued_events.unshift(event_data);
            }
            else {
                file_handle.destroy();
                queued_events.forEach((e) =>
                {
                    this.last_logged_event.setUTCHours(event_data.h, event_data.m, event_data.s);
                    this.__events__[e.operation](e.parameters);
                });
            }//else if last logged event occurred after next event's timestamp
          }//if the line parses to a known event string
        });
    }//__read_file__


    static filename_to_date(filename) {
        if (typeof(filename) != "string") {
          throw new TypeError("'filename' must be the netlog filename represented as a string.")
        }
        //take care of Unix and Windows full file paths
          filename = filename.substr(filename.lastIndexOf("/")+1);
          filename = filename.substr(filename.lastIndexOf("\\")+1);
        if (filename.startsWith("netLog")) {
          filename = /netLog\.(\d+)\.\d+/.exec(filename)[1]
        }

        return [
            Date.prototype.setYear,
            Date.prototype.setUTCMonth,
            Date.prototype.setUTCDate,
            Date.prototype.setUTCHours,
            Date.prototype.setUTCMinutes,
            Date.prototype.setUTCSeconds
        ].reduce((date, next_field, i) => {
            var next_digits = Number.parseInt(filename.substr(i * 2, 2));
            next_digits = next_digits + ( 2000 * (i == 0)); //the first two digits are only the last two digits of the year
            next_field.call(date, next_digits);
            return date;
        }, new Date());
    }//filename_to_date
}//Netlogger


Netlogger.prototype.__events__ = {
    "System": (system_string) => {
        //{21:03:14} System:"Meinjhalara" StarPos:(-66.375,73.688,-16.563)ly Body:23 RelPos:(-98581.6,-11.7145,14782.9)km Supercruise
        [, system_name, x, y, z] = /"(.+)" StarPos:\(([\d\-\.]+),([\d\-\.]+),([\d\-\.]+)\)ly/.exec(system_string);
        if (system_name != this.current_system) {
            this.current_system = system_name;
            this.emit('new-system', system_name, x, y, z)
        }
    },
    "Commander Put": (dock_state) => {
        this.emit(dock_state.toLowerCase()); //"docked" or "undocked"
    }
};

module.exports = Netlogger;