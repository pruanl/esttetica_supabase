-- Migration: Create profit calculation function
-- Description: Function to calculate appointment profit based on fixed expenses and procedure costs

-- Create the profit calculation function
CREATE OR REPLACE FUNCTION calculate_appointment_profit(appointment_id_param int8)
RETURNS JSON AS $$
DECLARE
    appointment_user_id UUID;
    total_fixed_expenses DECIMAL(10,2) := 0;
    cost_per_hour DECIMAL(10,2) := 0;
    procedure_price DECIMAL(10,2) := 0;
    procedure_cost DECIMAL(10,2) := 0;
    procedure_duration INTEGER := 0;
    time_cost DECIMAL(10,2) := 0;
    total_cost DECIMAL(10,2) := 0;
    profit DECIMAL(10,2) := 0;
    result JSON;
BEGIN
    -- 1. Get user_id from appointment
    SELECT user_id INTO appointment_user_id
    FROM appointments
    WHERE id = appointment_id_param::UUID;
    
    -- Check if appointment exists
    IF appointment_user_id IS NULL THEN
        RETURN json_build_object(
            'error', 'Appointment not found',
            'appointment_id', appointment_id_param
        );
    END IF;
    
    -- 2. Calculate total fixed expenses for the user
    SELECT COALESCE(SUM(amount), 0) INTO total_fixed_expenses
    FROM fixed_expenses
    WHERE user_id = appointment_user_id;
    
    -- 3. Calculate cost per hour (assuming 160 hours per month)
    cost_per_hour := total_fixed_expenses / 160;
    
    -- 4. Get procedure details (price, cost, duration)
    SELECT p.price, COALESCE(p.cost, 0), p.duration_minutes
    INTO procedure_price, procedure_cost, procedure_duration
    FROM appointments a
    JOIN procedures p ON a.procedure_id = p.id
    WHERE a.id = appointment_id_param::UUID;
    
    -- Check if procedure data was found
    IF procedure_price IS NULL THEN
        RETURN json_build_object(
            'error', 'Procedure data not found for appointment',
            'appointment_id', appointment_id_param
        );
    END IF;
    
    -- 5. Calculate time cost = (cost_per_hour / 60) * duration_in_minutes
    time_cost := (cost_per_hour / 60) * procedure_duration;
    
    -- 6. Calculate total cost = time_cost + material_cost
    total_cost := time_cost + procedure_cost;
    
    -- 7. Calculate profit = price - total_cost
    profit := procedure_price - total_cost;
    
    -- 8. Return JSON with all calculated values
    result := json_build_object(
        'price', procedure_price,
        'material_cost', procedure_cost,
        'time_cost', time_cost,
        'total_cost', total_cost,
        'profit', profit,
        'fixed_expenses_total', total_fixed_expenses,
        'cost_per_hour', cost_per_hour,
        'duration_minutes', procedure_duration
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', 'Error calculating profit: ' || SQLERRM,
            'appointment_id', appointment_id_param
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_appointment_profit(int8) TO authenticated;