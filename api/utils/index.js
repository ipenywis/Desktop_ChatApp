exports.addArrItem = (arr, item) => {
    if (typeof arr != "object") return null;
    //Check if Arr doesn't have the item
    let idx;
    if ((idx = arr.indexOf(item)) != -1) return null;
    arr.push(item);
    return arr;
};

exports.removeArrItems = arr => {
    var what,
        a = arguments,
        L = a.length,
        ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
};