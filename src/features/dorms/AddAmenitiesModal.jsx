import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    Divider,
    Icon,
} from "@mui/material";
import { convexMutation } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";
import DeleteIcon from "@mui/icons-material/Delete";

function AddAmenitiesModal({ dormId, existingAmenities, open, onClose, refresh }) {
    const [amenities, setAmenities] = useState([]);

    useEffect(() => {
        setAmenities(existingAmenities || []);
    }, [existingAmenities]);

    const handleChange = (index, field, value) => {
        const copy = [...amenities];
        copy[index][field] = value;
        setAmenities(copy);
    };

    const addRow = () => {
        setAmenities([...amenities, { name: "", type: "other", unitPrice: 0, unit: "", unitFeeType: "fixed" }]);
    };

    const save = async () => {
        if (!dormId || !amenities) return;
        await convexMutation(api.functions.amentities.updateDormAmenities, {
            dormId,
            amenities,
        });
        onClose();
        refresh();
    };

    const remove = (index) => {
        const copy = [...amenities];
        copy.splice(index, 1);
        setAmenities(copy);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Add Amenities</DialogTitle>
            <DialogContent dividers sx={{ maxHeight: 400 }}>
                {amenities.map((a, i) => (
                    <div key={i}>
                        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Grid item xs={2}>
                                <TextField
                                    label="Name"
                                    value={a.name}
                                    onChange={(e) => handleChange(i, "name", e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    select
                                    label="Type"
                                    value={a.type}
                                    onChange={(e) => handleChange(i, "type", e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    {[
                                        "electricity",
                                        "water",
                                        "internet",
                                        "garbage",
                                        "elevator",
                                        "management",
                                        "other",
                                    ].map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    type="number"
                                    label="Unit Price"
                                    value={a.unitPrice}
                                    onChange={(e) => handleChange(i, "unitPrice", Number(e.target.value))}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    label="Unit (kWh, m³, ...)"
                                    value={a.unit}
                                    onChange={(e) => handleChange(i, "unit", e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    select
                                    label="Fee Type"
                                    value={a.unitFeeType}
                                    onChange={(e) => handleChange(i, "unitFeeType", e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="metered">Metered</MenuItem>
                                    <MenuItem value="per_person">Per person</MenuItem>
                                    <MenuItem value="fixed">Fixed</MenuItem>
                                </TextField>
                            </Grid>
                            <Button aria-label="remove amenity" color="error" size="small" onClick={() => remove(i)}>
                                <DeleteIcon />
                            </Button>
                        </Grid>

                        {i < amenities.length - 1 && <Divider sx={{ mb: 2, borderBottomWidth: 3 }} />}
                    </div>
                ))}

                <Button variant="outlined" size="small" onClick={addRow}>
                    +
                </Button>
            </DialogContent>

            <DialogActions>
                <Button variant="outlined" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={save}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddAmenitiesModal;
