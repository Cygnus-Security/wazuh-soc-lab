/*
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package seed

import (
	"context"
	"log"
	"os"
	"time"

	"crapi.proj/goservice/api/models"
	"github.com/jinzhu/gorm"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

//initialize coupons data
var coupons = []models.Coupon{
	models.Coupon{
		CouponCode: "TRAC075",
		Amount:     "75",
		CreatedAt:  time.Now(),
	},
	models.Coupon{
		CouponCode: "TRAC065",
		Amount:     "65",
		CreatedAt:  time.Now(),
	},
	models.Coupon{
		CouponCode: "TRAC125",
		Amount:     "125",
		CreatedAt:  time.Now(),
	},
}

//initialize Post data
var posts = []models.Post{
	{
		Title:   "Best Car Maintenance Tips",
		Content: "Regular oil changes and tire rotations are essential for keeping your car running smoothly. I recommend changing your oil every 5,000 miles and rotating tires every 7,500 miles. Also, don't forget to check your brake pads and fluid levels monthly. A well-maintained car can last over 200,000 miles if you take care of it properly.",
	},
	{
		Title:   "My New Car Experience",
		Content: "Just picked up my new ride last week and I couldn't be happier! The fuel efficiency is amazing - I'm getting around 35 MPG on the highway. The interior is so comfortable with heated leather seats and a panoramic sunroof. The infotainment system connects seamlessly with my phone. Highly recommend test driving one if you're in the market.",
	},
	{
		Title:   "Car Wash Recommendations",
		Content: "Looking for the best car wash in town. Anyone have suggestions for a good detailing service? I've been going to the automatic wash but my paint is starting to show swirl marks. Thinking about trying a hand wash place or maybe doing it myself. What products do you guys use for a proper detail at home?",
	},
	{
		Title:   "Electric vs Gas Cars",
		Content: "Thinking about switching to electric for my next vehicle purchase. What are your experiences with EV charging infrastructure? I commute about 50 miles daily and there are a few charging stations near my office. The initial cost is higher but the fuel savings seem significant. Anyone made the switch recently? How's the range anxiety treating you?",
	},
	{
		Title:   "Road Trip Essentials",
		Content: "Planning a cross-country drive next month from coast to coast. What car accessories do you always bring on long trips? So far I have a phone mount, portable tire inflator, and emergency kit. Looking for recommendations on comfortable seat cushions for those 8+ hour driving days. Also need a good cooler that fits in the backseat.",
	},
	{
		Title:   "Car Insurance Advice",
		Content: "Just got quoted for my new vehicle and the prices are all over the place. Any tips on getting the best rates for comprehensive coverage? I've been with the same company for 10 years but they're not offering any loyalty discounts. Should I bundle with home insurance? What deductible amount do you guys usually go with?",
	},
	{
		Title:   "Winter Tire Discussion",
		Content: "Winter is coming and I need to prepare my car for the snow. Should I invest in dedicated winter tires or are all-seasons good enough for moderate snowfall? I live in an area that gets maybe 10-15 snow days per year. The cost of a second set of tires plus storage seems high but safety is important. What are your thoughts?",
	},
	{
		Title:   "Car Audio Upgrades",
		Content: "Looking to upgrade my factory sound system because the bass is practically nonexistent. Any recommendations for speakers and subwoofers that won't break the bank? I'm thinking a 10-inch sub in the trunk and maybe some component speakers up front. Should I also upgrade the head unit or will an amp be enough to power everything?",
	},
	{
		Title:   "Fuel Economy Tips",
		Content: "Gas prices are absolutely crazy right now and I'm looking to save wherever I can. What driving habits help you maximize your miles per gallon? I've heard keeping tires properly inflated and avoiding aggressive acceleration helps. Also thinking about using cruise control more on the highway. Any other tips you've found effective?",
	},
	{
		Title:   "Classic Car Restoration",
		Content: "Working on restoring a 1969 muscle car that's been sitting in my garage for years. Anyone have experience with finding original parts? The engine needs a complete rebuild and the interior is shot. I'm debating between keeping it original or doing a restomod with modern upgrades. Would love to connect with other classic car enthusiasts here.",
	},
}
var emails = [10]string{"adam007@example.com", "pogba006@example.com", "robot001@example.com", "adam007@example.com", "pogba006@example.com", "robot001@example.com", "adam007@example.com", "pogba006@example.com", "robot001@example.com", "adam007@example.com"}

//
func LoadMongoData(mongoClient *mongo.Client, db *gorm.DB) {
	var couponResult interface{}
	var postResult interface{}
	collection := mongoClient.Database(os.Getenv("MONGO_DB_NAME")).Collection("coupons")
	// get a MongoDB document using the FindOne() method
	err := collection.FindOne(context.TODO(), bson.D{}).Decode(&couponResult)
	if err != nil {
		for i := range coupons {
			couponData, err := collection.InsertOne(context.TODO(), coupons[i])
			log.Println(couponData, err)
		}
	}
	postCollection := mongoClient.Database(os.Getenv("MONGO_DB_NAME")).Collection("post")
	er := postCollection.FindOne(context.TODO(), bson.D{}).Decode(&postResult)
	if er != nil {
		for j := range posts {
			author, err := models.FindAuthorByEmail(emails[j], db)
			if err != nil {
				log.Println("Error finding author", err)
				continue
			}
			log.Println(author)
			posts[j].Prepare()
			postData, err := models.SavePost(mongoClient, posts[j]) // Assign the returned values to separate variables
			if err != nil {
				log.Println("Error saving post", err)
			}
			log.Println(postData) // Use the returned values as needed
		}
	}
	log.Println("Data seeded successfully")
}
