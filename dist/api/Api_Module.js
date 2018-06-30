"use strict";
var request = require('superagent');
var CronJob = require('cron').CronJob;
var _ = require('underscore');
var Api_Module = (function () {
    function Api_Module() {
    }
    Api_Module.triggerService = function (name, result, days) {
        var service = _.findWhere(result.body, { reference: name });
        if (!service) {
            console.log("Could not fetch service: " + name);
            return false;
        }
        if (!service.lastTriggered)
            service.lastTriggered = 0;
        var diff = Date.now() - service.lastTriggered;
        console.log(name + " service was last triggered " + diff + " ms ago");
        if (diff < days * 86400000)
            return false;
        console.log("Triggering service: " + name);
        request.post("https://dbstorestage.herokuapp.com/api/v1/" + name).end(function (err, result) { });
        return true;
    };
    Api_Module.serve = function () {
        var _this = this;
        new CronJob('0 */10 * * * *', function () {
            request.get("https://dbstorestage.herokuapp.com/api/v1/tasks").end(function (err, result) {
                if (err || !result || !result.body) {
                    console.log("Could not fetch tasks");
                    return;
                }
                var running = _.findWhere(result.body, { isComplete: false });
                if (running)
                    return;
                request.get("https://dbstorestage.herokuapp.com/api/v1/services").end(function (err1, result1) {
                    if (err1 || !result1 || !result1.body) {
                        console.log("Could not fetch services");
                        return;
                    }
                    _this.triggerService('offers', result1, 1)
                        || _this.triggerService('similarItems', result1, 3)
                        || _this.triggerService('popularItems', result1, 3)
                        || _this.triggerService('galleryItems', result1, 3);
                });
            });
        }, function () {
            console.log("Cron Ended!!");
        }, true, 'Asia/Kolkata', null, true);
    };
    return Api_Module;
}());
exports.Api_Module = Api_Module;

//# sourceMappingURL=Api_Module.js.map
