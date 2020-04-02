let tableDelivery = new Vue({
    el: "#tableDelivery",
    data: {
        delivery: [],
    },
    methods: {
        readDelivery: function() {
            axios
            .get("/BullsEye/api/mysqli.php", {
                params: {
                    stmt: "select * from delivery"
                }
            })
            .then(function (response) {
                tableDelivery.delivery = response.data;
                console.log(response);
            })
            .catch(function (error) {
                alert(error);
            });
        }
    }
});