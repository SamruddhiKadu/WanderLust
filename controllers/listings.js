const Listing = require("../models/listing.js");
const axios = require("axios"); // install with: npm install axios

module.exports.index = async (req,res) =>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs" , {allListings});
};

module.exports.renderNewForm =(req,res) => {
    
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate:{
            path:"author",
        },
    })
    .populate("owner");
    if(!listing){
        req.flash("error", "listing you requested for does not exist");
         res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", {listing});
};


module.exports.createListing = async (req, res, next) => {
  try {
    let url = req.file.path;
    let filename = req.file.filename;

    const { location, country, ...rest } = req.body.listing;

    // 🗺️ Use Nominatim to get coordinates
    const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: `${location}, ${country}`,
        format: "json",
        limit: 1,
      },
    });

    let coordinates = [77.2090, 28.6139]; // fallback: New Delhi
    if (geoResponse.data.length > 0) {
      coordinates = [
        parseFloat(geoResponse.data[0].lon),
        parseFloat(geoResponse.data[0].lat),
      ];
    }

    // Create new listing
    const newListing = new Listing({
      ...rest,
      location,
      country,
      image: { url, filename },
      owner: req.user._id,
      geometry: { type: "Point", coordinates },
    });

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while creating the listing.");
    res.redirect("/listings");
  }
};


// module.exports.createListing = async (req, res, next) => {
//    let url = req.file.path;
//    let filename = req.file.filename; 
//    const newListing = new Listing(req.body.listing);
//    newListing.owner = req.user._id;
//    newListing.image = {url , filename};
//    await newListing.save();
//    req.flash("success","New Listing Created!");
//    res.redirect("/listings");
// };

// module.exports.renderEditForm = async (req,res) => {
//     let {id} = req.params;
//     const listing = await Listing.findById(id);
//         if(!listing){
//         req.flash("error", "listing you requested for does not exist");
//         res.redirect("/listings");
//     }

//     let originalImageUrl = listing.image.url;
//     originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
//     res.render("listings/edit.ejs",{ listing, originalImageUrl });
// };
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }

  const originalImageUrl = listing.image.url.replace("/upload", "/upload/h_300,w_250");
  const [lon, lat] = listing.geometry.coordinates;

  res.render("listings/edit.ejs", {
    listing,
    originalImageUrl,
    mapCenter: { lat, lon }, // Pass to frontend for map initialization
  });
};

// module.exports.updateListing = async (req,res) => {
//     let {id} = req.params;
//     let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

//     if(typeof  req.file  != "undefined") {
//     let url = req.file.path;
//     let filename = req.file.filename; 
//     listing.image = {url , filename};
//     await listing.save();
//     }

//     req.flash("success","Listing Updated!");
//     res.redirect("/listings");
// };



module.exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, country, ...rest } = req.body.listing;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    // 🗺️ Convert location + country to coordinates
    let coordinates = listing.geometry.coordinates;
    if (location && country) {
      const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: `${location}, ${country}`,
          format: "json",
          limit: 1,
        },
      });

      if (geoResponse.data.length > 0) {
        coordinates = [
          parseFloat(geoResponse.data[0].lon),
          parseFloat(geoResponse.data[0].lat),
        ];
      }
    }

    // 🖼️ Update image if new file is uploaded
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    // 📝 Update listing fields
    listing.location = location;
    listing.country = country;
    listing.geometry = { type: "Point", coordinates };
    for (let key in rest) {
      listing[key] = rest[key];
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect("/listings");
  } catch (err) {
    console.error("Update Error:", err);
    req.flash("error", "Error updating listing.");
    res.redirect("/listings");
  }
};


module.exports.destroyListing = async (req,res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    
   req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};

