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
    // console.log(listing);
    res.render("listings/show.ejs", {listing});
};



module.exports.createListing = async (req, res, next) => {
  try {
    const url = req.file.path;
    const filename = req.file.filename;
    const { location, country, ...rest } = req.body.listing;

    // 🗺️ Geocode location with proper User-Agent
    async function geocodeLocation(locationQuery) {
      try {
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: {
            q: locationQuery,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent": "WanderlustApp/1.0 (your-email@example.com)", // required
            "Accept-Language": "en",
          },
        });

        if (response.data && response.data.length > 0) {
          return [
            parseFloat(response.data[0].lon),
            parseFloat(response.data[0].lat),
          ];
        }
        return null;
      } catch (err) {
        console.error("Geocoding error:", err.message);
        return null;
      }
    }

    // Get coordinates or fallback
    let coordinates = await geocodeLocation(`${location}, ${country}`);
    if (!coordinates) coordinates = [77.2090, 28.6139]; // fallback: New Delhi

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



module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { location, country, ...rest } = req.body.listing;

    // Geocode location with proper User-Agent
    async function geocodeLocation(locationQuery) {
      try {
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: {
            q: locationQuery,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent": "WanderlustApp/1.0 (your-email@example.com)", // required
            "Accept-Language": "en",
          },
        });

        if (response.data && response.data.length > 0) {
          return [
            parseFloat(response.data[0].lon),
            parseFloat(response.data[0].lat),
          ];
        }
        return null;
      } catch (err) {
        console.error("Geocoding error:", err.message);
        return null;
      }
    }

    // Get coordinates or fallback
    let coordinates = await geocodeLocation(`${location}, ${country}`);
    if (!coordinates) coordinates = [77.2090, 28.6139]; // fallback: New Delhi

    // Update listing
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        ...rest,
        location,
        country,
        geometry: { type: "Point", coordinates },
      },
      { new: true, runValidators: true }
    );

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while updating the listing.");
    res.redirect(`/listings/${req.params.id}/edit`);
  }
};


module.exports.destroyListing = async (req,res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    
   req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};

